import type { NextApiRequest, NextApiResponse } from "next";
import supabaseAdmin from "../../lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  const { data, error } = await supabaseAdmin
    .from("benchmarks")
    .select("id, name")
    .order("name");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
