import { ResendCallEmailSender } from "@/lib/email/call-transcript";
import {
  submitRecordingForTranscription,
  TwilioBatchTranscriptionClient,
} from "@/lib/twilio/batch-transcription";
import { logTwilioEvent } from "@/lib/twilio/logging";
import { SupabasePhase4Repository } from "@/lib/twilio/phase4-repository";
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
    const telephonyRepository = new SupabaseTelephonyRepository();
    await telephonyRepository.updateRecording(
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

    const phase4Repository = new SupabasePhase4Repository();
    const call =
      await phase4Repository.findCallByRecordingSid(recordingSid);
    if (!call) {
      logTwilioEvent("error", "twilio.recording_call_not_found", {
        callSid,
        recordingSid,
      });
      return new Response(null, { status: 200 });
    }

    await submitRecordingForTranscription(
      call,
      phase4Repository,
      new TwilioBatchTranscriptionClient(),
      new ResendCallEmailSender(),
    );

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
