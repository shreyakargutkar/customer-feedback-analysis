import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, anon);

type CommentRow = {
  created_at: string;
  sentiment: "Favourable" | "Unfavourable" | "Neutral" | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end();
    }

    const { data, error } = await supabase
      .from("comments")
      .select("created_at, sentiment");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const trend: Record<
      string,
      { Favourable: number; Unfavourable: number; Neutral: number }
    > = {};

    (data as CommentRow[]).forEach((d) => {
      if (!d.created_at || !d.sentiment) return;

      const month = new Date(d.created_at).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!trend[month]) {
        trend[month] = { Favourable: 0, Unfavourable: 0, Neutral: 0 };
      }

      trend[month][d.sentiment]++;
    });

    return res.status(200).json({ trend });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
