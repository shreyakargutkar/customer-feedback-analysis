import type { NextApiRequest, NextApiResponse } from "next";
import supabaseAdmin from "../../lib/supabaseAdmin";
import { preprocessText, fallbackSentiment, analyzeAspects, getMainAspect } from "../../lib/nlp";

type KeywordDBRow = {
  keyword: string;
  polarity: "positive" | "negative";
};

function checkIfNegated(text: string, keyword: string): boolean {
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
  
  const kwCleaned = keyword.toLowerCase().replace(/[^\w\s]/g, " ");
  const kwTokens = kwCleaned.split(/\s+/).filter(t => t.length > 0);
  
  if (kwTokens.length === 0) return false;
  
  for (let i = 0; i <= tokens.length - kwTokens.length; i++) {
    let match = true;
    for (let j = 0; j < kwTokens.length; j++) {
      if (tokens[i + j] !== kwTokens[j]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      const negations = ["not", "never", "no"];
      if (i > 0 && negations.includes(tokens[i - 1])) {
        return true;
      }
      if (i > 1 && negations.includes(tokens[i - 2])) {
        return true;
      }
    }
  }
  
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const {
    guest_name,
    outlet_id,
    rating,
    comment_text,
    phone,
    email,
    address,
  } = req.body || {};

  if (!guest_name || !outlet_id || !comment_text || !phone || !email || !rating) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ✅ 1. Preprocess & ABSA Aspect Analysis
    const { cleanedText, tokens } = preprocessText(comment_text);
    let aspectDetails = analyzeAspects(comment_text);
    let mainAspect = getMainAspect(aspectDetails);

    // ✅ 2. Load DB Keywords for Validation Layer
    const { data: keywordData } = await supabaseAdmin
      .from("keywords")
      .select("keyword, polarity");

    const keywords = (keywordData ?? []) as KeywordDBRow[];
    const lowerComment = comment_text.toLowerCase();
    const activePositiveMatches: string[] = [];
    const activeNegativeMatches: string[] = [];
    const logPositiveMatches: string[] = [];
    const logNegativeMatches: string[] = [];

    for (const k of keywords) {
      const kw = k.keyword.trim().toLowerCase();
      if (kw && lowerComment.includes(kw)) {
        const isNegated = checkIfNegated(comment_text, kw);
        
        if (k.polarity === "positive") {
          if (isNegated) {
            logPositiveMatches.push(`${kw} (NEGATED)`);
          } else {
            logPositiveMatches.push(kw);
            activePositiveMatches.push(kw);
          }
        } else if (k.polarity === "negative") {
          if (isNegated) {
            logNegativeMatches.push(`${kw} (NEGATED)`);
            activePositiveMatches.push(`${kw} (NEGATED NEGATIVE)`);
          } else {
            logNegativeMatches.push(kw);
            activeNegativeMatches.push(kw);
          }
        }
      }
    }

    let dbSentiment: "Favourable" | "Unfavourable" | "Neutral" | null = null;
    if (activePositiveMatches.length > 0 || activeNegativeMatches.length > 0) {
      if (activePositiveMatches.length > 0 && activeNegativeMatches.length > 0) {
        dbSentiment = "Neutral";
      } else if (activePositiveMatches.length > 0) {
        dbSentiment = "Favourable";
      } else {
        dbSentiment = "Unfavourable";
      }
    }

    // ✅ 3. Run Local Flask NLP Model (PRIMARY)
    let sentiment: "Favourable" | "Unfavourable" | "Neutral" = "Neutral";
    let sentiment_confidence = 0.5;
    let sentiment_reason = "";
    let flaskResult: any = null;
    let flaskFailed = false;

    let pipeline_used: "local_nlp_engine" | "rule_based_fallback" = "local_nlp_engine";
    let roberta_prediction: string | null = null;
    let roberta_confidence: number | null = null;
    let confidence_adjustments: string | null = null;

    console.log("--- Local Flask NLP Model Inference Check ---");
    console.log(`Payload Text:   "${comment_text}"`);
    console.log(`Processed text: "${cleanedText}"`);
    console.log("----------------------------------------------");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        let response = null;
        let usedPort = 5001;

        try {
          console.log("Attempting to query Flask sentiment model on http://localhost:5001/predict...");
          response = await fetch("http://localhost:5001/predict", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: comment_text }),
            signal: controller.signal
          });
        } catch (err: any) {
          console.warn("Flask on port 5001 connection failed or timed out:", err.message || err);
        }

        // If port 5001 is unreachable or returned an error, try port 5000
        if (!response || !response.ok) {
          console.warn(`Flask on port 5001 was unreachable or returned status ${response ? response.status : "null"}. Trying fallback port 5000...`);
          try {
            const fallbackController = new AbortController();
            const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 2000);
            response = await fetch("http://localhost:5000/predict", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ text: comment_text }),
              signal: fallbackController.signal
            });
            clearTimeout(fallbackTimeoutId);
            usedPort = 5000;
          } catch (err: any) {
            console.error("Flask on port 5000 also failed:", err.message || err);
          }
        }

        clearTimeout(timeoutId);

        if (response && response.ok) {
          flaskResult = await response.json();
          console.log(`Flask Sentiment Model Result (Port ${usedPort}):`, JSON.stringify(flaskResult, null, 2));
        } else {
          const errBody = response ? await response.text() : "No response";
          console.error(`❌ Flask prediction endpoint returned error: ${response ? response.status : "Unknown"}. Body: ${errBody}`);
          flaskFailed = true;
        }
      } catch (flaskErr: any) {
      console.error("❌ Flask sentiment model is unavailable or failed:", flaskErr.message || flaskErr);
      flaskFailed = true;
    }

    // ✅ 4. Fallback Sentiment Evaluator (if Flask scorer fails)
    if (flaskFailed || !flaskResult) {
      const fallback = fallbackSentiment(tokens);
      sentiment = fallback.sentiment;
      sentiment_confidence = fallback.confidence;
      sentiment_reason = `Local Flask Model failed/unavailable. Fallback: ${fallback.reason}`;
      pipeline_used = "rule_based_fallback";
    } 
    
    // ✅ 5. Local Flask Model Sentiment + Dynamic Keyword Validation Layer
    else {
      pipeline_used = "local_nlp_engine"; // Keeps "Local NLP Engine" UI badge rendering cleanly
      const orSentiment = flaskResult.sentiment;
      const orConfidence = flaskResult.confidence;

      roberta_prediction = orSentiment;
      roberta_confidence = orConfidence;
      sentiment = orSentiment;
      sentiment_confidence = orConfidence;

      if (dbSentiment === null) {
        sentiment_reason = `Local Flask Model primary classification: ${orSentiment} (no database keywords matched). Rationale: ${flaskResult.reason}. Contributing words: ${JSON.stringify(flaskResult.important_words)}`;
        confidence_adjustments = "No DB keyword matches. Confidence score kept unchanged.";
      } else if (orSentiment === dbSentiment) {
        sentiment_confidence = Number(Math.min(0.99, orConfidence + 0.15).toFixed(2));
        const matchedKw = orSentiment === "Favourable" ? logPositiveMatches : logNegativeMatches;
        sentiment_reason = `Local Flask Model classified as ${orSentiment}. Confirmed by database keyword matches: ${matchedKw.join(", ")}. Rationale: ${flaskResult.reason}. Contributing words: ${JSON.stringify(flaskResult.important_words)}`;
        confidence_adjustments = "Confirmed by DB keywords. Confidence score boosted.";
      } else {
        if (dbSentiment === "Neutral") {
          sentiment_confidence = Number(Math.max(0.40, orConfidence - 0.10).toFixed(2));
          sentiment_reason = `Local Flask Model classified as ${orSentiment} but database keyword matches were mixed: ${[...logPositiveMatches, ...logNegativeMatches].join(", ")}. Rationale: ${flaskResult.reason}. Contributing words: ${JSON.stringify(flaskResult.important_words)}`;
          confidence_adjustments = "DB keywords were mixed. Confidence score reduced.";
        } else {
          const opposedKw = orSentiment === "Favourable" ? logNegativeMatches : logPositiveMatches;
          const skipOverride = (orConfidence >= 0.55 && tokens.some(t => ["not", "never", "no"].includes(t)));

          if (skipOverride) {
            sentiment = orSentiment;
            sentiment_confidence = orConfidence;
            sentiment_reason = `Local Flask Model classified as ${orSentiment} (confidence ${orConfidence} >= 0.55 with negation detected) and took priority over opposing database keyword matches: ${opposedKw.join(", ")}. Rationale: ${flaskResult.reason}. Contributing words: ${JSON.stringify(flaskResult.important_words)}`;
            confidence_adjustments = "Opposing DB keywords ignored because model confidence is high and negation was detected.";
          } else {
            sentiment_confidence = Number(Math.max(0.30, orConfidence - 0.30).toFixed(2));
            if (sentiment_confidence < 0.50) {
              sentiment = "Neutral";
              sentiment_reason = `Local Flask Model classified as ${orSentiment} but database detected strong opposing indicators: ${opposedKw.join(", ")}. Overriden to Neutral due to low confidence. Rationale: ${flaskResult.reason}. Contributing words: ${JSON.stringify(flaskResult.important_words)}`;
              confidence_adjustments = "Strong opposing DB keywords matched. Sentiment overriden to Neutral due to low confidence.";
            } else {
              sentiment_reason = `Local Flask Model classified as ${orSentiment} but database detected opposing indicators: ${opposedKw.join(", ")}. Rationale: ${flaskResult.reason}. Contributing words: ${JSON.stringify(flaskResult.important_words)}`;
              confidence_adjustments = "Opposing DB keywords matched. Confidence score reduced.";
            }
          }
        }
      }
    }

    const negation_detected = tokens.some(t => ["not", "never", "no"].includes(t));
    const aiReasoning = {
      pipeline_used,
      processed_text: cleanedText,
      roberta_prediction,
      roberta_confidence,
      keyword_validation: {
        positive_matches: logPositiveMatches,
        negative_matches: logNegativeMatches,
      },
      negation_detected,
      aspect_analysis: aspectDetails,
      confidence_adjustments,
      final_sentiment: sentiment,
      final_reason: sentiment_reason,
    };

    // ✅ 6. Prepare Payload & Safe Insert
    const insertPayload: any = {
      guest_name,
      outlet_id,
      rating: String(rating),
      comment_text,
      phone,
      email,
      address: address || null,
      sentiment,
      sentiment_confidence,
      sentiment_reason,
      category: mainAspect,
      processed_text: cleanedText,
      aspect_details: aspectDetails,
      ai_reasoning: aiReasoning,
    };

    let inserted = null;
    let error = null;

    try {
      const result = await supabaseAdmin
        .from("comments")
        .insert([insertPayload])
        .select()
        .single();
      inserted = result.data;
      error = result.error;
    } catch (e: any) {
      error = e;
    }

    // Graceful fallback for aspect_details, processed_text, or ai_reasoning missing columns
    if (error && (
      error.message?.includes("ai_reasoning") ||
      error.message?.includes("aspect_details") ||
      error.code === "PGRST204" ||
      error.message?.includes("processed_text")
    )) {
      console.warn("Retrying insert due to missing columns in DB schema...");
      
      delete insertPayload.ai_reasoning;
      delete insertPayload.aspect_details;
      
      let retryResult = await supabaseAdmin
        .from("comments")
        .insert([insertPayload])
        .select()
        .single();
      
      inserted = retryResult.data;
      error = retryResult.error;

      if (error && (error.message?.includes("processed_text") || error.code === "PGRST204")) {
        console.warn("Retrying insert without processed_text...");
        delete insertPayload.processed_text;
        
        retryResult = await supabaseAdmin
          .from("comments")
          .insert([insertPayload])
          .select()
          .single();
        
        inserted = retryResult.data;
        error = retryResult.error;
      }
    }

    if (error) {
      return res.status(500).json({ error: error.message || String(error) });
    }

    return res.status(200).json({ ok: true, data: inserted });
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}
