import { logTwilioEvent } from "@/lib/twilio/logging";
import { validateTwilioRequest } from "@/lib/twilio/request-validation";
import { SupabaseTelephonyRepository } from "@/lib/twilio/telephony-repository";
import {
  databaseFailureTwiml,
  invalidSignatureResponse,
  resolveContactTwiml,
  twimlResponse,
} from "@/lib/twilio/voice-flow";

export const runtime = "nodejs";

function parseConfidence(value: string | null) {
  if (value === null) return undefined;
  const confidence = Number(value);
  return Number.isFinite(confidence) ? confidence : undefined;
}

export async function POST(request: Request) {
  let callSid: string | undefined;

  try {
    const validated = await validateTwilioRequest(request);
    if (!validated) {
      logTwilioEvent("error", "twilio.invalid_signature", {
        path: "/api/twilio/resolve-contact",
      });
      return invalidSignatureResponse();
    }

    const from =
      validated.params.get("From") ?? validated.params.get("Caller");
    callSid = validated.params.get("CallSid") ?? undefined;
    if (!from || !callSid) {
      logTwilioEvent("error", "twilio.invalid_payload", {
        callSid,
        path: "/api/twilio/resolve-contact",
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhoneNumber) {
      throw new Error("TWILIO_PHONE_NUMBER is not configured.");
    }

    const attempt =
      new URL(request.url).searchParams.get("attempt") === "1" ? 1 : 0;
    const xml = await resolveContactTwiml(
      {
        attempt,
        callSid,
        digits: validated.params.get("Digits") ?? undefined,
        from,
        speechConfidence: parseConfidence(
          validated.params.get("Confidence"),
        ),
        speechResult: validated.params.get("SpeechResult") ?? undefined,
        twilioPhoneNumber,
      },
      new SupabaseTelephonyRepository(),
    );

    logTwilioEvent("info", "twilio.contact_resolution_handled", {
      attempt,
      callSid,
    });
    return twimlResponse(xml);
  } catch (error) {
    logTwilioEvent(
      "error",
      "twilio.contact_resolution_failed",
      { callSid },
      error,
    );
    return twimlResponse(databaseFailureTwiml());
  }
}
