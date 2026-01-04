// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error("Missing Supabase URL or SERVICE ROLE KEY in env");
}

// SERVER-ONLY CLIENT (never import in frontend)
const supabaseAdmin = createClient(url, serviceKey);

export default supabaseAdmin;
