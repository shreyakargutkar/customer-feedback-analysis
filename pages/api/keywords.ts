// pages/api/keywords.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_POLARITY = ["positive", "negative"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ---------------- GET ----------------
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("keywords")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    // ---------------- POST ----------------
    if (req.method === "POST") {
      const {
        keyword,
        polarity,
        benchmark_id,
        sub_benchmark_id,
      } = req.body || {};

      if (!keyword || !benchmark_id) {
        return res.status(400).json({
          error: "keyword and benchmark_id are required",
        });
      }

      const pol = String(polarity || "positive").toLowerCase();
      const safePol = ALLOWED_POLARITY.includes(pol)
        ? pol
        : "positive";

      const { data, error } = await supabaseAdmin
        .from("keywords")
        .insert([
          {
            keyword: String(keyword).trim().toLowerCase(),
            polarity: safePol,
            benchmark_id,
            sub_benchmark_id: sub_benchmark_id || null,
          },
        ])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ data });
    }

    // ---------------- DELETE ----------------
    if (req.method === "DELETE") {
      const id = (req.query.id as string) || req.body?.id;

      if (!id) {
        return res.status(400).json({ error: "id required" });
      }

      const { error } = await supabaseAdmin
        .from("keywords")
        .delete()
        .eq("id", id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });

  } catch (err: any) {
    console.error("keywords API error", err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
