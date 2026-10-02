import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Server-only. Uses the service role key, which bypasses Row Level Security.
// Never import this file from a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase admin configuration.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
