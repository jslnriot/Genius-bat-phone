import { ResendCallEmailSender } from "@/lib/email/call-transcript";
import {
  handleTranscriptionCallback,
  parseTranscriptionCallback,
} from "@/lib/twilio/batch-transcription";
import { logTwilioEvent } from "@/lib/twilio/logging";
import { SupabasePhase4Repository } from "@/lib/twilio/phase4-repository";
import { validateTwilioJsonRequest } from "@/lib/twilio/request-validation";
import { invalidSignatureResponse } from "@/lib/twilio/voice-flow";

export const runtime = "nodejs";

function hasSourceId(value: unknown): value is { sourceId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "sourceId" in value &&
    typeof value.sourceId === "string" &&
    value.sourceId.length > 0
  );
}

export async function POST(request: Request) {
  let recordingSid: string | undefined;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return new Response("Unsupported callback content type.", {
        status: 415,
      });
    }

    const validated = await validateTwilioJsonRequest(request);
    if (!validated) {
      logTwilioEvent("error", "twilio.invalid_signature", {
        path: "/api/twilio/transcription",
      });
      return invalidSignatureResponse();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(validated.rawBody);
    } catch {
      logTwilioEvent("error", "twilio.invalid_json", {
        path: "/api/twilio/transcription",
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    if (!hasSourceId(parsed)) {
      logTwilioEvent("error", "twilio.transcription_source_missing", {
        path: "/api/twilio/transcription",
      });
      return new Response(null, { status: 200 });
    }
    recordingSid = parsed.sourceId;

    const payload = parseTranscriptionCallback(parsed);
    if (!payload) {
      logTwilioEvent("error", "twilio.invalid_payload", {
        path: "/api/twilio/transcription",
        recordingSid,
      });
      return new Response("Invalid Twilio payload.", { status: 400 });
    }

    const repository = new SupabasePhase4Repository();
    const call = await repository.findCallByRecordingSid(payload.sourceId);
    if (!call) {
      logTwilioEvent("error", "twilio.transcription_call_not_found", {
        recordingSid,
        transcriptionId: payload.id,
      });
      return new Response(null, { status: 200 });
    }

    await handleTranscriptionCallback(
      payload,
      call,
      repository,
      new ResendCallEmailSender(),
    );

    return new Response(null, { status: 200 });
  } catch (error) {
    logTwilioEvent(
      "error",
      "twilio.transcription_callback_failed",
      { recordingSid },
      error,
    );
    return new Response(null, { status: 500 });
  }
}
