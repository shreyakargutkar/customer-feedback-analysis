import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, anon);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end();
    }

    const { outlet_id } = req.query;

    let query = supabase
      .from("comments")
      .select("rating");

    if (outlet_id) {
      query = query.eq("outlet_id", outlet_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const summary = {
      Excellent: 0,
      Good: 0,
      Fair: 0,
      Poor: 0,
    };

    data?.forEach((row: any) => {
      if (row.rating === 5) summary.Excellent += 1;
      else if (row.rating === 4) summary.Good += 1;
      else if (row.rating === 3) summary.Fair += 1;
      else if (row.rating === 2 || row.rating === 1) summary.Poor += 1;
    });

    const total =
      summary.Excellent +
      summary.Good +
      summary.Fair +
      summary.Poor;

    const result = {
      total,
      Excellent: summary.Excellent,
      Good: summary.Good,
      Fair: summary.Fair,
      Poor: summary.Poor,
      percentages: {
        Excellent: total ? ((summary.Excellent / total) * 100).toFixed(2) : "0",
        Good: total ? ((summary.Good / total) * 100).toFixed(2) : "0",
        Fair: total ? ((summary.Fair / total) * 100).toFixed(2) : "0",
        Poor: total ? ((summary.Poor / total) * 100).toFixed(2) : "0",
      },
    };

    return res.status(200).json({ data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
