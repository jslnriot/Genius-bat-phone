import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/utils/supabase/public-env";

export function createClient() {
  const { supabaseUrl, publishableKey } = getPublicSupabaseEnv();

  return createBrowserClient(
    supabaseUrl,
    publishableKey,
  );
}
