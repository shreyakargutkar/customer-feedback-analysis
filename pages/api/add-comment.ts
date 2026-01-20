import type { NextApiRequest, NextApiResponse } from "next";
import supabaseAdmin from "../../lib/supabaseAdmin";

type KeywordDBRow = {
  keyword: string;
  polarity: "positive" | "negative";
};

type HFAIResult = {
  label: "LABEL_0" | "LABEL_1" | "LABEL_2";
  score: number;
};

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
    // ✅ LOAD KEYWORDS — NO BENCHMARKS, NO JOINS
    const { data } = await supabaseAdmin
      .from("keywords")
      .select("keyword, polarity");

    const keywords = (data ?? []) as KeywordDBRow[];

    const text = comment_text.toLowerCase();

    const positiveMatches: string[] = [];
    const negativeMatches: string[] = [];

    for (const k of keywords) {
      const kw = k.keyword.trim().toLowerCase();
      if (kw && text.includes(kw)) {
        if (k.polarity === "positive") positiveMatches.push(kw);
        if (k.polarity === "negative") negativeMatches.push(kw);
      }
    }

    let sentiment: "Favourable" | "Unfavourable" | "Neutral";
    let sentiment_reason = "";
    let sentiment_confidence = 0;

    // ✅ KEYWORD-BASED SENTIMENT (WORKING LOGIC)
    if (positiveMatches.length > 0 || negativeMatches.length > 0) {
      if (positiveMatches.length > 0 && negativeMatches.length > 0) {
        sentiment = "Neutral";
        sentiment_confidence = 0.65;
        sentiment_reason =
          "Both positive and negative keywords were detected: " +
          [...positiveMatches, ...negativeMatches].join(", ");
      } else if (positiveMatches.length > 0) {
        sentiment = "Favourable";
        sentiment_confidence = 0.95;
        sentiment_reason =
          "Positive keywords were detected: " +
          positiveMatches.join(", ");
      } else {
        sentiment = "Unfavourable";
        sentiment_confidence = 0.95;
        sentiment_reason =
          "Negative keywords were detected: " +
          negativeMatches.join(", ");
      }
    }

    // ✅ AI FALLBACK (ONLY IF NO KEYWORDS)
    else {
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: comment_text }),
        }
      );

      const rawHF = await hfResponse.json();

      let results: HFAIResult[] = [];

      if (Array.isArray(rawHF)) {
        results = Array.isArray(rawHF[0]) ? rawHF[0] : rawHF;
      }

      if (!results.length) {
        sentiment = "Neutral";
        sentiment_confidence = 0.5;
        sentiment_reason =
          "AI response unavailable. Defaulted to Neutral.";
      } else {
        let top = results[0];
        for (const r of results) {
          if (r.score > top.score) top = r;
        }

        sentiment_confidence = Number(top.score.toFixed(2));

        if (top.label === "LABEL_2") sentiment = "Favourable";
        else if (top.label === "LABEL_0") sentiment = "Unfavourable";
        else sentiment = "Neutral";

        sentiment_reason =
          "No keywords found. AI classified as " + sentiment + ".";
      }
    }

    // ✅ INSERT COMMENT
    const { data: inserted, error } = await supabaseAdmin
      .from("comments")
      .insert([
        {
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
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, data: inserted });
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}
