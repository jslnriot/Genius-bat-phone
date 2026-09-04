import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/utils/supabase/public-env";

export function createAdminClient() {
  const { supabaseUrl } = getPublicSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  // Twilio callbacks and post-call processing do not run as a signed-in browser
  // user, so they need a trusted server-only client instead of the RLS-scoped one.
  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
