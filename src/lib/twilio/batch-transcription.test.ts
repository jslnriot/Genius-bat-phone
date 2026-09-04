import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildReadableTranscript,
  handleTranscriptionCallback,
  submitRecordingForTranscription,
  TwilioBatchTranscriptionClient,
} from "./batch-transcription";
import type { CallEmailSender } from "@/lib/email/call-transcript";
import type {
  Phase4Call,
  Phase4Repository,
} from "./phase4-repository";

const call: Phase4Call = {
  id: "call-1",
  user_id: "user-1",
  contact_name_snapshot: "Ada Lovelace",
  destination_number: "+12125550199",
  start_time: "2026-09-02T18:00:00.000Z",
  duration: 30,
  recording_sid: "RE11111111111111111111111111111111",
  recording_url: "https://api.twilio.com/recording/RE111",
  recording_duration: 28,
  transcript: null,
  transcription_id: null,
  transcription_status: null,
  transcription_attempts: 0,
  email_status: null,
  email_attempts: 0,
  email_sent_at: null,
};

function dependencies(overrides: Partial<Phase4Repository> = {}) {
  const repository: Phase4Repository = {
    findCallByRecordingSid: vi.fn(async () => call),
    claimTranscription: vi.fn(async () => true),
    setTranscriptionAttempt: vi.fn(async () => undefined),
    markTranscriptionSubmitted: vi.fn(async () => undefined),
    markTranscriptionFailed: vi.fn(async () => undefined),
    storeCompletedTranscription: vi.fn(async () => undefined),
    claimEmail: vi.fn(async () => true),
    setEmailAttempt: vi.fn(async () => undefined),
    markEmailSent: vi.fn(async () => undefined),
    markEmailFailed: vi.fn(async () => undefined),
    markEmailSkipped: vi.fn(async () => undefined),
    resolveUserEmail: vi.fn(async () => "caller@example.com"),
    ...overrides,
  };
  const sender: CallEmailSender = {
    send: vi.fn(async () => undefined),
  };
  return { repository, sender };
}

beforeEach(() => {
  process.env.RESEND_FROM_EMAIL =
    "Bat Phone <transcripts@batphone.thedevnotebook.com>";
});

describe("Batch Transcription submission", () => {
  it("uses the recording SID as sourceId in the Twilio request", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "secret";
    process.env.TWILIO_TRANSCRIPTION_CONFIGURATION_ID =
      "voice_transcriptionconfiguration_123";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            transcription: { id: "voice_transcription_123" },
          }),
          { status: 201 },
        ),
      );

    await new TwilioBatchTranscriptionClient().submit(call.recording_sid!);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://voice.twilio.com/v3/Transcriptions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          transcriptionConfigurationId:
            "voice_transcriptionconfiguration_123",
          sourceId: call.recording_sid,
        }),
      }),
    );
    fetchMock.mockRestore();
  });

  it("does not submit duplicate recording webhooks", async () => {
    const { repository, sender } = dependencies();
    const client = { submit: vi.fn(async () => ({ id: "job-1" })) };

    await submitRecordingForTranscription(
      { ...call, transcription_status: "pending" },
      repository,
      client,
      sender,
    );

    expect(client.submit).not.toHaveBeenCalled();
    expect(repository.claimTranscription).not.toHaveBeenCalled();
  });

  it("retries submission once and stores the successful job", async () => {
    const { repository, sender } = dependencies();
    const client = {
      submit: vi
        .fn()
        .mockRejectedValueOnce(new Error("temporary"))
        .mockResolvedValueOnce({ id: "job-1" }),
    };

    await submitRecordingForTranscription(
      call,
      repository,
      client,
      sender,
    );

    expect(client.submit).toHaveBeenCalledTimes(2);
    expect(client.submit).toHaveBeenCalledWith(call.recording_sid);
    expect(repository.setTranscriptionAttempt).toHaveBeenNthCalledWith(
      2,
      call.id,
      2,
    );
    expect(repository.markTranscriptionSubmitted).toHaveBeenCalledWith(
      call.id,
      "job-1",
    );
  });

  it("marks final submission failure and sends a fallback email", async () => {
    const { repository, sender } = dependencies();
    const client = {
      submit: vi.fn(async () => {
        throw new Error("unavailable");
      }),
    };

    await submitRecordingForTranscription(
      call,
      repository,
      client,
      sender,
    );

    expect(client.submit).toHaveBeenCalledTimes(2);
    expect(repository.markTranscriptionFailed).toHaveBeenCalledWith(call.id);
    expect(sender.send).toHaveBeenCalledOnce();
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Transcript unavailable."),
        to: "caller@example.com",
      }),
      `bat-phone-call-${call.id}`,
    );
  });
});

describe("Batch Transcription callbacks", () => {
  it("transitions pending transcription to completed and stores transcript", async () => {
    const { repository, sender } = dependencies();

    await handleTranscriptionCallback(
      {
        id: "job-1",
        sourceId: call.recording_sid!,
        status: "completed",
        sentences: [
          {
            audioChannelIndex: 2,
            sentenceIndex: 2,
            startTimeSeconds: 2,
            text: "Hello back.",
          },
          {
            audioChannelIndex: 1,
            sentenceIndex: 1,
            startTimeSeconds: 0,
            text: "Hello.",
          },
        ],
      },
      { ...call, transcription_status: "processing" },
      repository,
      sender,
    );

    expect(repository.storeCompletedTranscription).toHaveBeenCalledWith(
      call.id,
      "job-1",
      "Caller:\nHello.\n\nAda Lovelace:\nHello back.",
    );
    expect(sender.send).toHaveBeenCalledOnce();
  });

  it("transitions processing transcription to failed and sends fallback email", async () => {
    const { repository, sender } = dependencies();

    await handleTranscriptionCallback(
      {
        id: "job-1",
        sourceId: call.recording_sid!,
        status: "failed",
      },
      { ...call, transcription_status: "processing" },
      repository,
      sender,
    );

    expect(repository.markTranscriptionFailed).toHaveBeenCalledWith(
      call.id,
      "job-1",
    );
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Transcript unavailable."),
      }),
      expect.any(String),
    );
  });

  it("marks transcription failed when completed callback has no usable sentences", async () => {
    const { repository, sender } = dependencies();

    await handleTranscriptionCallback(
      {
        id: "job-1",
        sourceId: call.recording_sid!,
        status: "completed",
        sentences: [{ text: "   " }],
      },
      { ...call, transcription_status: "processing" },
      repository,
      sender,
    );

    expect(repository.storeCompletedTranscription).not.toHaveBeenCalled();
    expect(repository.markTranscriptionFailed).toHaveBeenCalledWith(
      call.id,
      "job-1",
    );
    expect(sender.send).toHaveBeenCalledOnce();
  });

  it("does not resend email for a duplicate completed callback", async () => {
    const { repository, sender } = dependencies();

    await handleTranscriptionCallback(
      {
        id: "job-1",
        sourceId: call.recording_sid!,
        status: "completed",
        sentences: [{ text: "Duplicate." }],
      },
      {
        ...call,
        email_status: "sent",
        transcript: "Stored transcript",
        transcription_status: "completed",
      },
      repository,
      sender,
    );

    expect(repository.storeCompletedTranscription).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("sorts sentence text chronologically with proven channel labels", () => {
    expect(
      buildReadableTranscript(
        [
          { startTimeSeconds: 3, text: "Second", audioChannelIndex: 2 },
          { startTimeSeconds: 1, text: "First", audioChannelIndex: 1 },
        ],
        "Ada",
      ),
    ).toBe("Caller:\nFirst\n\nAda:\nSecond");
  });
});
