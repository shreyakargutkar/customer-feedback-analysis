import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { outlet_id } = req.body;

  if (!outlet_id) {
    return res.status(400).json({ error: "Outlet ID is required" });
  }

  const { data: comments, error } = await supabase
    .from("comments")
    .select("comment_text")
    .eq("outlet_id", outlet_id)
    .eq("sentiment", "Unfavourable");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!comments || comments.length === 0) {
    return res.json({
      conclusion:
        "No significant negative feedback found for this outlet.",
      actions: [
        "Continue maintaining current service standards",
        "Monitor customer feedback regularly",
      ],
    });
  }

  const text = comments.map(c => c.comment_text).join("\n");

  const prompt = `
You are a service quality analyst.

Analyze the following negative customer feedback and provide:
1. A short service improvement conclusion
2. 3 clear recommended actions

Customer Feedback:
${text}
`;

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  const aiJson = await aiRes.json();

  const aiText =
    aiJson.choices?.[0]?.message?.content || "No insight generated.";

  return res.json({
    insight: aiText,
  });
}
