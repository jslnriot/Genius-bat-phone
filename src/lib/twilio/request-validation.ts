import "server-only";

import twilio from "twilio";
import { getTwilioAuthToken } from "@/lib/twilio/environment";

type ValidatedTwilioRequest = {
  params: URLSearchParams;
};

type ValidatedTwilioJsonRequest = {
  rawBody: string;
};

export function externallyVisibleUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  // Twilio signs the public webhook URL it called, not an internal platform URL.
  // Reconstruct that externally visible URL before validating the signature.
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
  const authToken = getTwilioAuthToken();
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
  const authToken = getTwilioAuthToken();
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return null;

  const rawBody = await request.text();
  // Twilio's JSON callback signature covers the raw body bytes, so validation
  // must happen before JSON.parse changes formatting or key order.
  const isValid = twilio.validateRequestWithBody(
    authToken,
    signature,
    externallyVisibleUrl(request),
    rawBody,
  );

  return isValid ? { rawBody } : null;
}
