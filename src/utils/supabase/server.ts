import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/utils/supabase/public-env";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, publishableKey } = getPublicSupabaseEnv();

  // This client represents the current browser session on the server, so reads
  // and writes still flow through the same authenticated RLS boundary.
  return createServerClient(
    supabaseUrl,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. proxy.ts refreshes them.
          }
        },
      },
    },
  );
}
