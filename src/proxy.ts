import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveSafeReturnPath } from "@/lib/safe-return-path";
import { getPublicSupabaseEnv } from "@/utils/supabase/public-env";

const protectedPaths = ["/contacts", "/calls", "/onboarding"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { supabaseUrl, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient(
    supabaseUrl,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
          Object.entries(cacheHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();

  const requiresAuth = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`),
  );

  if (requiresAuth && !claimsData?.claims) {
    const accountUrl = new URL("/account", request.url);
    const safeNext = resolveSafeReturnPath(request.nextUrl.pathname);
    if (safeNext) {
      accountUrl.searchParams.set("next", safeNext);
    }

    const redirectResponse = NextResponse.redirect(accountUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
