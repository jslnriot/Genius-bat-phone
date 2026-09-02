import { logTwilioEvent } from "@/lib/twilio/logging";
import { validateTwilioRequest } from "@/lib/twilio/request-validation";
import { SupabaseTelephonyRepository } from "@/lib/twilio/telephony-repository";
import {
  databaseFailureTwiml,
  dialCompleteTwiml,
  invalidSignatureResponse,
  twimlResponse,
} from "@/lib/twilio/voice-flow";

export const runtime = "nodejs";

const DIAL_STATUSES = new Set([
  "busy",
  "canceled",
  "completed",
  "failed",
  "no-answer",
]);

function parseDuration(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export async function POST(request: Request) {
  let callSid: string | undefined;
  let dialStatus = "failed";

  try {
    const validated = await validateTwilioRequest(request);
    if (!validated) {
      logTwilioEvent("error", "twilio.invalid_signature", {
        path: "/api/twilio/dial-complete",
      });
      return invalidSignatureResponse();
    }

    callSid = validated.params.get("CallSid") ?? undefined;
    const receivedStatus = validated.params.get("DialCallStatus");
    if (!callSid || !receivedStatus) {
      logTwilioEvent("error", "twilio.invalid_payload", {
        callSid,
        path: "/api/twilio/dial-complete",
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    dialStatus = DIAL_STATUSES.has(receivedStatus) ? receivedStatus : "failed";
    const duration = parseDuration(
      validated.params.get("DialCallDuration"),
    );

    await new SupabaseTelephonyRepository().updateDialResult(
      callSid,
      dialStatus,
      duration,
    );
    logTwilioEvent("info", "twilio.dial_completed", {
      callSid,
      dialStatus,
      duration,
    });

    return twimlResponse(dialCompleteTwiml(dialStatus));
  } catch (error) {
    logTwilioEvent(
      "error",
      "twilio.dial_completion_failed",
      { callSid, dialStatus },
      error,
    );
    return twimlResponse(databaseFailureTwiml());
  }
}
