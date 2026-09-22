type AccountIdentitySource = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstLetter(value: string) {
  const match = value.match(/\p{L}/u);
  return match ? match[0].toUpperCase() : null;
}

function initialsFromWords(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter((word) => firstLetter(word));

  if (words.length >= 2) {
    const first = firstLetter(words[0]);
    const last = firstLetter(words[words.length - 1]);
    return first && last ? `${first}${last}` : null;
  }

  return words[0] ? firstLetter(words[0]) : null;
}

function getDisplayName(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return "";

  const fullName = readString(metadata.full_name);
  if (fullName) return fullName;

  const name = readString(metadata.name);
  if (name) return name;

  return [readString(metadata.given_name), readString(metadata.family_name)]
    .filter(Boolean)
    .join(" ");
}

export function getAccountInitials(source: AccountIdentitySource) {
  const fromName = initialsFromWords(getDisplayName(source.user_metadata));
  if (fromName) return fromName;

  const localPart = (source.email ?? "").split("@")[0]?.split("+")[0] ?? "";
  const fromEmail = initialsFromWords(localPart.replace(/[._-]+/g, " "));
  if (fromEmail && fromEmail.length === 2) return fromEmail;

  const letters = localPart.replace(/[^\p{L}]/gu, "");
  if (letters.length === 2) return letters.toUpperCase();

  return firstLetter(letters) ?? "A";
}
