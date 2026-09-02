import { logTwilioEvent } from "@/lib/twilio/logging";
import { validateTwilioRequest } from "@/lib/twilio/request-validation";
import { SupabaseTelephonyRepository } from "@/lib/twilio/telephony-repository";
import { invalidSignatureResponse } from "@/lib/twilio/voice-flow";

export const runtime = "nodejs";

function parseDuration(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export async function POST(request: Request) {
  let callSid: string | undefined;

  try {
    const validated = await validateTwilioRequest(request);
    if (!validated) {
      logTwilioEvent("error", "twilio.invalid_signature", {
        path: "/api/twilio/recording",
      });
      return invalidSignatureResponse();
    }

    callSid = validated.params.get("CallSid") ?? undefined;
    const recordingStatus = validated.params.get("RecordingStatus");
    if (!callSid || !recordingStatus) {
      logTwilioEvent("error", "twilio.invalid_payload", {
        callSid,
        path: "/api/twilio/recording",
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    if (recordingStatus !== "completed") {
      logTwilioEvent("info", "twilio.recording_ignored", {
        callSid,
        recordingStatus,
      });
      return new Response(null, { status: 200 });
    }

    const recordingSid = validated.params.get("RecordingSid");
    const recordingUrl = validated.params.get("RecordingUrl");
    if (!recordingSid || !recordingUrl) {
      logTwilioEvent("error", "twilio.invalid_payload", {
        callSid,
        path: "/api/twilio/recording",
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    const recordingDuration = parseDuration(
      validated.params.get("RecordingDuration"),
    );
    await new SupabaseTelephonyRepository().updateRecording(
      callSid,
      recordingSid,
      recordingUrl,
      recordingDuration,
    );
    logTwilioEvent("info", "twilio.recording_saved", {
      callSid,
      recordingDuration,
      recordingSid,
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    logTwilioEvent(
      "error",
      "twilio.recording_failed",
      { callSid },
      error,
    );
    return new Response(null, { status: 500 });
  }
}
