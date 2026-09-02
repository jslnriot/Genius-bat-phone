export type MatchableContact = {
  id: string;
  name: string;
  phone_number: string;
  user_id: string;
};

export type ContactMatch =
  | {
      status: "matched";
      contact: MatchableContact;
      method: "exact" | "case-insensitive" | "fuzzy";
    }
  | { status: "ambiguous" | "none" };

function normalizeContactNameCaseSensitive(value: string) {
  return value
    .normalize("NFC")
    .replace(/\p{P}/gu, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeContactName(value: string) {
  return normalizeContactNameCaseSensitive(value).toLocaleLowerCase("en-US");
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function singleContact(
  contacts: MatchableContact[],
  method: "exact" | "case-insensitive",
): ContactMatch | null {
  if (contacts.length === 1) {
    return { status: "matched", contact: contacts[0], method };
  }

  return contacts.length > 1 ? { status: "ambiguous" } : null;
}

export function matchContactByName(
  spokenName: string,
  contacts: MatchableContact[],
): ContactMatch {
  const caseSensitiveName = normalizeContactNameCaseSensitive(spokenName);
  if (!caseSensitiveName) return { status: "none" };

  const exact = singleContact(
    contacts.filter(
      (contact) =>
        normalizeContactNameCaseSensitive(contact.name) === caseSensitiveName,
    ),
    "exact",
  );
  if (exact) return exact;

  const normalizedName = normalizeContactName(spokenName);
  const caseInsensitive = singleContact(
    contacts.filter(
      (contact) => normalizeContactName(contact.name) === normalizedName,
    ),
    "case-insensitive",
  );
  if (caseInsensitive) return caseInsensitive;

  if (normalizedName.length < 4) return { status: "none" };

  const candidates = contacts
    .map((contact) => {
      const candidateName = normalizeContactName(contact.name);
      const distance = levenshteinDistance(normalizedName, candidateName);
      const longestLength = Math.max(normalizedName.length, candidateName.length);
      const similarity =
        longestLength === 0 ? 0 : 1 - distance / longestLength;
      const maximumDistance = longestLength >= 12 ? 2 : 1;

      return { contact, distance, similarity, maximumDistance };
    })
    .filter(
      ({ distance, similarity, maximumDistance }) =>
        distance <= maximumDistance && similarity >= 0.88,
    )
    .sort(
      (left, right) =>
        right.similarity - left.similarity || left.distance - right.distance,
    );

  if (candidates.length === 0) return { status: "none" };
  if (
    candidates.length > 1 &&
    candidates[0].similarity - candidates[1].similarity < 0.08
  ) {
    return { status: "ambiguous" };
  }

  return {
    status: "matched",
    contact: candidates[0].contact,
    method: "fuzzy",
  };
}
