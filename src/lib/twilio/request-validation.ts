import "server-only";

import twilio from "twilio";

export type ValidatedTwilioRequest = {
  params: URLSearchParams;
};

export type ValidatedTwilioJsonRequest = {
  rawBody: string;
};

export function externallyVisibleUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (!forwardedHost) return request.url;

  const protocol =
    forwardedProto?.split(",")[0]?.trim() || requestUrl.protocol.slice(0, -1);
  return `${protocol}://${forwardedHost.split(",")[0].trim()}${requestUrl.pathname}${requestUrl.search}`;
}

function validationParameters(params: URLSearchParams) {
  const values: Record<string, string | string[]> = {};

  for (const [key, value] of params) {
    const current = values[key];
    if (current === undefined) {
      values[key] = value;
    } else if (Array.isArray(current)) {
      current.push(value);
    } else {
      values[key] = [current, value];
    }
  }

  return values;
}

export async function validateTwilioRequest(
  request: Request,
): Promise<ValidatedTwilioRequest | null> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is not configured.");
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return null;

  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const isValid = twilio.validateRequest(
    authToken,
    signature,
    externallyVisibleUrl(request),
    validationParameters(params),
  );

  return isValid ? { params } : null;
}

export async function validateTwilioJsonRequest(
  request: Request,
): Promise<ValidatedTwilioJsonRequest | null> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is not configured.");
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return null;

  const rawBody = await request.text();
  const isValid = twilio.validateRequestWithBody(
    authToken,
    signature,
    externallyVisibleUrl(request),
    rawBody,
  );

  return isValid ? { rawBody } : null;
}
