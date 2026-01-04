// pages/api/sub-benchmarks.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const benchmark_id = req.query.benchmark_id as string;

  if (!benchmark_id) {
    return res.status(200).json({ data: [] });
  }

  const { data, error } = await supabase
    .from("sub_benchmarks")
    .select("id, name")
    .eq("benchmark_id", benchmark_id)
    .order("name");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
