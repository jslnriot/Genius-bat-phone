import { NextResponse } from "next/server";
import { getCallingNumber } from "@/lib/calling-number";
import {
  RETURN_TO_COOKIE,
  oauthReturnToCookieOptions,
  readReturnToCookie,
  resolveSafeReturnPath,
} from "@/lib/safe-return-path";
import { createClient } from "@/utils/supabase/server";

function finishAuthRedirect(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.set(RETURN_TO_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(
    RETURN_TO_COOKIE,
    "",
    oauthReturnToCookieOptions(0),
  );
  return response;
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return finishAuthRedirect(`${origin}/account?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return finishAuthRedirect(`${origin}/account?error=auth_callback`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return finishAuthRedirect(`${origin}/account?error=no_user`);
  }

  const callingNumber = await getCallingNumber(supabase, user.id);
  const safeNext =
    resolveSafeReturnPath(searchParams.get("next")) ??
    resolveSafeReturnPath(readReturnToCookie(request.headers.get("cookie")));

  if (!callingNumber) {
    return finishAuthRedirect(`${origin}/onboarding`);
  }

  if (safeNext) {
    return finishAuthRedirect(`${origin}${safeNext}`);
  }

  return finishAuthRedirect(`${origin}/contacts`);
}
