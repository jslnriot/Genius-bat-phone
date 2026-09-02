export const CONTACT_NAME_MAX_LENGTH = 50;
export const PHONE_DIGIT_LENGTH = 10;
export const E164_PHONE_PATTERN = /^\+1\d{10}$/;
export const CONTACT_NAME_PATTERN =
  /^(?=.*\p{L})[\p{L}\p{M} .'\u2019-]+$/u;

export type FieldErrors = {
  name?: string;
  phoneNumber?: string;
};

export type ContactRecord = {
  id: string;
  name: string;
  phone_number: string;
  created_at: string;
};

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; message: string; fieldErrors?: FieldErrors };

export function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, PHONE_DIGIT_LENGTH);
}

export function formatPhoneNumber(value: string) {
  const digits = getPhoneDigits(value);

  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function e164ToDisplayPhone(value: string) {
  return E164_PHONE_PATTERN.test(value)
    ? formatPhoneNumber(value.slice(2))
    : formatPhoneNumber(value);
}

export function displayPhoneToE164(value: string) {
  const digits = getPhoneDigits(value);
  return digits.length === PHONE_DIGIT_LENGTH ? `+1${digits}` : null;
}

export function validateDisplayPhone(value: string) {
  return getPhoneDigits(value).length === PHONE_DIGIT_LENGTH
    ? undefined
    : "Enter a complete 10-digit phone number.";
}

export function normalizeContactName(value: unknown) {
  return typeof value === "string"
    ? value.normalize("NFC").trim().replace(/\s+/g, " ")
    : "";
}

export function validateContactName(value: unknown) {
  const name = normalizeContactName(value);

  if (!name) {
    return "Enter a contact name.";
  }
  if (name.length > CONTACT_NAME_MAX_LENGTH) {
    return "Name must be 50 characters or fewer.";
  }
  if (!CONTACT_NAME_PATTERN.test(name)) {
    return "Use letters, spaces, apostrophes, periods, or hyphens only.";
  }

  return undefined;
}

export function validateContactInput(name: unknown, phoneNumber: unknown) {
  const normalizedName = normalizeContactName(name);
  const canonicalPhone = typeof phoneNumber === "string" ? phoneNumber : "";
  const fieldErrors: FieldErrors = {};
  const nameError = validateContactName(normalizedName);

  if (nameError) {
    fieldErrors.name = nameError;
  }

  if (!E164_PHONE_PATTERN.test(canonicalPhone)) {
    fieldErrors.phoneNumber = "Enter a valid 10-digit US phone number.";
  }

  return {
    name: normalizedName,
    phoneNumber: canonicalPhone,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export function validateProfilePhone(phoneNumber: unknown) {
  return typeof phoneNumber === "string" &&
    E164_PHONE_PATTERN.test(phoneNumber)
    ? undefined
    : "Enter a valid 10-digit US phone number.";
}
