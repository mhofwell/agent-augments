import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Admin client with secret key - use for server-side operations only
// This bypasses RLS policies
// Uses SUPABASE_SECRET_KEY (new format: sb_secret_...)
// Falls back to legacy SUPABASE_SERVICE_ROLE_KEY for backwards compatibility
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }

  if (!supabaseKey) {
    throw new Error(
      "supabaseKey is required. Set SUPABASE_SECRET_KEY (sb_secret_...) in your environment. " +
      "Get it from: Supabase Dashboard → Settings → API Keys"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
