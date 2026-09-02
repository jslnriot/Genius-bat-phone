import "server-only";

import { sendCallEmail, type CallEmailSender } from "@/lib/email/call-transcript";
import { logTwilioEvent } from "@/lib/twilio/logging";
import type {
  Phase4Call,
  Phase4Repository,
} from "@/lib/twilio/phase4-repository";

const TRANSCRIPTIONS_URL = "https://voice.twilio.com/v3/Transcriptions";

export type TranscriptionSentence = {
  audioChannelIndex?: number;
  sentenceIndex?: number;
  participantIndex?: number | null;
  startTimeSeconds?: number;
  text: string;
};

export type TranscriptionCallback = {
  id: string;
  accountId?: string;
  status: "completed" | "failed";
  transcriptionConfigurationId?: string;
  sourceId: string;
  duration?: number;
  participants?: Array<{
    audioChannelIndex?: number;
    type?: string;
    address?: string;
    name?: string;
  }>;
  sentences?: TranscriptionSentence[];
  createdAt?: string;
  updatedAt?: string;
};

export interface BatchTranscriptionClient {
  submit(recordingSid: string): Promise<{ id: string }>;
}

export class TwilioBatchTranscriptionClient
  implements BatchTranscriptionClient
{
  async submit(recordingSid: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const configurationId =
      process.env.TWILIO_TRANSCRIPTION_CONFIGURATION_ID;

    if (!accountSid || !authToken || !configurationId) {
      throw new Error("Twilio transcription environment is not configured.");
    }

    const response = await fetch(TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcriptionConfigurationId: configurationId,
        sourceId: recordingSid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twilio transcription submission returned ${response.status}.`);
    }

    const result: unknown = await response.json();
    const id =
      isRecord(result) &&
      isRecord(result.transcription) &&
      typeof result.transcription.id === "string"
        ? result.transcription.id
        : null;
    if (!id) {
      throw new Error("Twilio transcription submission omitted its job ID.");
    }

    return { id };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTranscriptionCallback(
  value: unknown,
): TranscriptionCallback | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0) return null;
  if (value.status !== "completed" && value.status !== "failed") return null;
  if (typeof value.sourceId !== "string" || value.sourceId.length === 0) {
    return null;
  }

  const sentences = Array.isArray(value.sentences)
    ? value.sentences.flatMap((sentence) => {
        if (!isRecord(sentence) || typeof sentence.text !== "string") return [];
        return [
          {
            audioChannelIndex:
              typeof sentence.audioChannelIndex === "number"
                ? sentence.audioChannelIndex
                : undefined,
            sentenceIndex:
              typeof sentence.sentenceIndex === "number"
                ? sentence.sentenceIndex
                : undefined,
            participantIndex:
              typeof sentence.participantIndex === "number" ||
              sentence.participantIndex === null
                ? sentence.participantIndex
                : undefined,
            startTimeSeconds:
              typeof sentence.startTimeSeconds === "number"
                ? sentence.startTimeSeconds
                : undefined,
            text: sentence.text,
          },
        ];
      })
    : undefined;

  const participants = Array.isArray(value.participants)
    ? value.participants.filter(isRecord).map((participant) => ({
        audioChannelIndex:
          typeof participant.audioChannelIndex === "number"
            ? participant.audioChannelIndex
            : undefined,
        type:
          typeof participant.type === "string" ? participant.type : undefined,
        address:
          typeof participant.address === "string"
            ? participant.address
            : undefined,
        name:
          typeof participant.name === "string" ? participant.name : undefined,
      }))
    : undefined;

  return {
    id: value.id,
    accountId:
      typeof value.accountId === "string" ? value.accountId : undefined,
    status: value.status,
    transcriptionConfigurationId:
      typeof value.transcriptionConfigurationId === "string"
        ? value.transcriptionConfigurationId
        : undefined,
    sourceId: value.sourceId,
    duration: typeof value.duration === "number" ? value.duration : undefined,
    participants,
    sentences,
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : undefined,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : undefined,
  };
}

export function buildReadableTranscript(
  sentences: TranscriptionSentence[],
  contactName: string | null,
) {
  const ordered = [...sentences]
    .filter((sentence) => sentence.text.trim().length > 0)
    .sort((left, right) => {
      const leftTime = left.startTimeSeconds ?? Number.MAX_SAFE_INTEGER;
      const rightTime = right.startTimeSeconds ?? Number.MAX_SAFE_INTEGER;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return (left.sentenceIndex ?? 0) - (right.sentenceIndex ?? 0);
    });

  return ordered
    .map((sentence) => {
      const speaker =
        sentence.audioChannelIndex === 1
          ? "Caller"
          : sentence.audioChannelIndex === 2
            ? contactName ?? "Destination"
            : null;
      return speaker
        ? `${speaker}:\n${sentence.text.trim()}`
        : sentence.text.trim();
    })
    .join("\n\n");
}

export async function submitRecordingForTranscription(
  call: Phase4Call,
  repository: Phase4Repository,
  client: BatchTranscriptionClient,
  emailSender: CallEmailSender,
) {
  if (
    call.transcription_id ||
    ["pending", "processing", "completed", "failed"].includes(
      call.transcription_status ?? "",
    )
  ) {
    return;
  }

  if (!(await repository.claimTranscription(call.id))) return;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await repository.setTranscriptionAttempt(call.id, attempt);
    try {
      const transcription = await client.submit(call.recording_sid!);
      await repository.markTranscriptionSubmitted(call.id, transcription.id);
      logTwilioEvent("info", "twilio.transcription_submitted", {
        attempt,
        callId: call.id,
        recordingSid: call.recording_sid,
        transcriptionId: transcription.id,
      });
      return;
    } catch (error) {
      logTwilioEvent(
        "error",
        "twilio.transcription_submission_failed",
        {
          attempt,
          callId: call.id,
          recordingSid: call.recording_sid,
        },
        error,
      );
    }
  }

  await repository.markTranscriptionFailed(call.id);
  await sendCallEmail(
    { ...call, transcription_status: "failed" },
    null,
    repository,
    emailSender,
  );
}

export async function handleTranscriptionCallback(
  payload: TranscriptionCallback,
  call: Phase4Call,
  repository: Phase4Repository,
  emailSender: CallEmailSender,
) {
  if (
    call.transcription_status === "completed" &&
    call.transcript &&
    call.transcript.length > 0
  ) {
    return;
  }

  if (payload.status === "failed") {
    await repository.markTranscriptionFailed(call.id, payload.id);
    logTwilioEvent("error", "twilio.transcription_failed", {
      callId: call.id,
      recordingSid: payload.sourceId,
      transcriptionId: payload.id,
    });
    await sendCallEmail(
      { ...call, transcription_id: payload.id, transcription_status: "failed" },
      null,
      repository,
      emailSender,
    );
    return;
  }

  const transcript = buildReadableTranscript(
    payload.sentences ?? [],
    call.contact_name_snapshot,
  );
  if (!transcript) {
    await repository.markTranscriptionFailed(call.id, payload.id);
    logTwilioEvent("error", "twilio.transcription_sentences_missing", {
      callId: call.id,
      recordingSid: payload.sourceId,
      transcriptionId: payload.id,
    });
    await sendCallEmail(
      { ...call, transcription_id: payload.id, transcription_status: "failed" },
      null,
      repository,
      emailSender,
    );
    return;
  }

  await repository.storeCompletedTranscription(call.id, payload.id, transcript);
  await sendCallEmail(
    {
      ...call,
      transcript,
      transcription_id: payload.id,
      transcription_status: "completed",
    },
    transcript,
    repository,
    emailSender,
  );
}

export { TRANSCRIPTIONS_URL };
