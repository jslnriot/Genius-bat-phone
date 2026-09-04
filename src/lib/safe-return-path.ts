const SAFE_RETURN_PATH_PATTERN = /^\/[\w\-/.%]+$/;

export function resolveSafeReturnPath(value: string | null | undefined) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://") || trimmed.includes(":")) return null;
  if (trimmed.includes("\\") || /\s/.test(trimmed)) return null;
  if (!SAFE_RETURN_PATH_PATTERN.test(trimmed)) return null;

  return trimmed;
}
