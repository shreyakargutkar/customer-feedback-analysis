import type { NextApiRequest, NextApiResponse } from "next";
import supabaseAdmin from "../../lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const benchmark_id = req.query.benchmark_id as string;

  if (!benchmark_id) {
    return res.status(200).json({ data: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("sub_benchmarks")
    .select("id, name")
    .eq("benchmark_id", benchmark_id)
    .order("name");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
