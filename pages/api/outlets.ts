// pages/api/outlets.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * API:
 * GET  -> list outlets
 * POST -> add outlet { outlet_name }
 * DELETE -> delete outlet { id } or ?id=...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("outlets")
        .select("id, outlet_name, created_at")
        .order("outlet_name", { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    if (req.method === "POST") {
      const { outlet_name } = req.body || {};
      if (!outlet_name || typeof outlet_name !== "string") {
        return res.status(400).json({ error: "Missing or invalid outlet_name" });
      }

      const { data, error } = await supabaseAdmin
        .from("outlets")
        .insert([{ outlet_name: outlet_name.trim() }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ data });
    }

    if (req.method === "DELETE") {
      const id = (req.body && req.body.id) || req.query.id;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const { error } = await supabaseAdmin.from("outlets").delete().eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("/api/outlets error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
