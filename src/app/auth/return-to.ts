"use server";

import { cookies } from "next/headers";
import {
  RETURN_TO_COOKIE,
  RETURN_TO_COOKIE_MAX_AGE,
  oauthReturnToCookieOptions,
  resolveSafeReturnPath,
} from "@/lib/safe-return-path";

export async function persistOAuthReturnTo(returnTo?: string | null) {
  const cookieStore = await cookies();
  const safeReturnTo = resolveSafeReturnPath(returnTo);

  if (!safeReturnTo) {
    cookieStore.set(
      RETURN_TO_COOKIE,
      "",
      oauthReturnToCookieOptions(0),
    );
    return;
  }

  cookieStore.set(
    RETURN_TO_COOKIE,
    safeReturnTo,
    oauthReturnToCookieOptions(RETURN_TO_COOKIE_MAX_AGE),
  );
}
