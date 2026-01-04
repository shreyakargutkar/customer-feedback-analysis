import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAnon = createClient(url, anon);
const supabaseService = serviceRole ? createClient(url, serviceRole) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { outlet_id } = req.query;

      let query = supabaseAnon
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (outlet_id) {
        query = query.eq("outlet_id", outlet_id);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data });
    }

    if (req.method === "DELETE") {
      if (!supabaseService) {
        return res.status(500).json({ error: "Service role key missing" });
      }

      const id = req.body?.id ?? req.query?.id;

      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }

      const { data, error } = await supabaseService
        .from("comments")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, deleted: data });
    }

    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
