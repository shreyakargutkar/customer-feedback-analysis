import type { NextApiRequest, NextApiResponse } from "next";
import supabaseAdmin from "../../lib/supabaseAdmin";

type KeywordDBRow = {
  keyword: string;
  polarity: "positive" | "negative";
  benchmark: { name: string }[] | null;
  sub_benchmark: { name: string }[] | null;
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
    comment_text,
    phone,
    email,
    address,
  } = req.body || {};

  if (!guest_name || !outlet_id || !comment_text || !phone || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1️⃣ LOAD KEYWORDS
    const { data } = await supabaseAdmin
      .from("keywords")
      .select(`
        keyword,
        polarity,
        benchmark:benchmark_id ( name ),
        sub_benchmark:sub_benchmark_id ( name )
      `);

    const keywords = (data ?? []) as KeywordDBRow[];
    const text = comment_text.toLowerCase();

    const positiveMatches: string[] = [];
    const negativeMatches: string[] = [];

    const benchmarkSet = new Set<string>();
    const subBenchmarkSet = new Set<string>();

    for (const k of keywords) {
      if (text.includes(k.keyword.toLowerCase())) {
        if (k.polarity === "positive") positiveMatches.push(k.keyword);
        if (k.polarity === "negative") negativeMatches.push(k.keyword);

        if (k.benchmark?.[0]?.name) benchmarkSet.add(k.benchmark[0].name);
        if (k.sub_benchmark?.[0]?.name)
          subBenchmarkSet.add(k.sub_benchmark[0].name);
      }
    }

    let sentiment: "Favourable" | "Unfavourable" | "Neutral";
    let sentiment_reason = "";
    let sentiment_confidence = 0;

    // 2️⃣ KEYWORD-BASED SENTIMENT (PRIORITY)
    if (positiveMatches.length > 0 || negativeMatches.length > 0) {
      if (positiveMatches.length > 0 && negativeMatches.length > 0) {
        sentiment = "Neutral";
        sentiment_confidence = 0.65;
        sentiment_reason =
          "Both positive and negative keywords found in database: " +
          [...positiveMatches, ...negativeMatches].join(", ");
      } else if (positiveMatches.length > 0) {
        sentiment = "Favourable";
        sentiment_confidence = 0.95;
        sentiment_reason =
          "Positive keywords found in database: " +
          positiveMatches.join(", ");
      } else {
        sentiment = "Unfavourable";
        sentiment_confidence = 0.95;
        sentiment_reason =
          "Negative keywords found in database: " +
          negativeMatches.join(", ");
      }
    }

    // 3️⃣ AI-BASED SENTIMENT (SAFE FALLBACK)
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
        if (Array.isArray(rawHF[0])) {
          results = rawHF[0];
        } else {
          results = rawHF;
        }
      }

      if (!results.length) {
        sentiment = "Neutral";
        sentiment_confidence = 0.5;
        sentiment_reason =
          "AI response unavailable. Defaulted to Neutral sentiment.";
      } else {
        let top = results[0];
        for (const r of results) {
          if (
            typeof r.score === "number" &&
            r.score > (top.score ?? 0)
          ) {
            top = r;
          }
        }

        sentiment_confidence =
          typeof top.score === "number"
            ? Number(top.score.toFixed(2))
            : 0.5;

        if (top.label === "LABEL_2") sentiment = "Favourable";
        else if (top.label === "LABEL_0") sentiment = "Unfavourable";
        else sentiment = "Neutral";

        sentiment_reason =
          "No keywords found. AI classified the comment as " +
          sentiment +
          ".";
      }
    }

    // 4️⃣ INSERT INTO DB
    const { data: inserted, error } = await supabaseAdmin
      .from("comments")
      .insert([
        {
          guest_name,
          outlet_id,
          comment_text,
          phone,
          email,
          address: address || null,
          sentiment,
          sentiment_confidence,
          sentiment_reason,
          benchmarks: Array.from(benchmarkSet),
          sub_benchmarks: Array.from(subBenchmarkSet),
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
