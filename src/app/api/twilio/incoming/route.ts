import { logTwilioEvent } from "@/lib/twilio/logging";
import { validateTwilioRequest } from "@/lib/twilio/request-validation";
import { SupabaseTelephonyRepository } from "@/lib/twilio/telephony-repository";
import {
  databaseFailureTwiml,
  incomingCallTwiml,
  invalidSignatureResponse,
  twimlResponse,
} from "@/lib/twilio/voice-flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let callSid: string | undefined;

  try {
    const validated = await validateTwilioRequest(request);
    if (!validated) {
      logTwilioEvent("error", "twilio.invalid_signature", {
        path: "/api/twilio/incoming",
      });
      return invalidSignatureResponse();
    }

    const from = validated.params.get("From");
    callSid = validated.params.get("CallSid") ?? undefined;
    if (!from || !callSid) {
      logTwilioEvent("error", "twilio.invalid_payload", {
        callSid,
        path: "/api/twilio/incoming",
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    const xml = await incomingCallTwiml(
      from,
      new SupabaseTelephonyRepository(),
    );
    logTwilioEvent("info", "twilio.incoming_handled", { callSid });
    return twimlResponse(xml);
  } catch (error) {
    logTwilioEvent(
      "error",
      "twilio.incoming_failed",
      { callSid },
      error,
    );
    return twimlResponse(databaseFailureTwiml());
  }
}
