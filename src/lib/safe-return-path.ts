const SAFE_RETURN_PATH_PATTERN = /^\/[\w\-/.%]+$/;

export const RETURN_TO_COOKIE = "bp_return_to";
export const RETURN_TO_COOKIE_MAX_AGE = 600;
export const RETURN_TO_COOKIE_PATH = "/auth/callback";

export function oauthReturnToCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: RETURN_TO_COOKIE_PATH,
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

export function resolveSafeReturnPath(value: string | null | undefined) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://") || trimmed.includes(":")) return null;
  if (trimmed.includes("\\") || /\s/.test(trimmed)) return null;
  if (!SAFE_RETURN_PATH_PATTERN.test(trimmed)) return null;

  return trimmed;
}

export function readReturnToCookie(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    if (trimmed.slice(0, separator) !== RETURN_TO_COOKIE) continue;

    const raw = trimmed.slice(separator + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return null;
}
