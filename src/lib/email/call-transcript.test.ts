import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  buildCallEmail,
  sendCallEmail,
  type CallEmailSender,
} from "./call-transcript";
import type {
  Phase4Call,
  Phase4Repository,
} from "@/lib/twilio/phase4-repository";

const call: Phase4Call = {
  id: "call-1",
  user_id: "initiating-user",
  contact_name_snapshot: "Destination Contact",
  destination_number: "+12125550199",
  start_time: "2026-09-02T18:00:00.000Z",
  duration: 32,
  recording_sid: "RE111",
  recording_url: "https://api.twilio.com/recordings/RE111",
  recording_duration: 30,
  transcript: "Caller:\nHello.\n\nDestination Contact:\nHi.",
  transcription_id: "job-1",
  transcription_status: "completed",
  transcription_attempts: 1,
  email_status: null,
  email_attempts: 0,
  email_sent_at: null,
};

function repository(): Phase4Repository {
  return {
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
    resolveUserEmail: vi.fn(async () => "initiator@example.com"),
  };
}

beforeEach(() => {
  process.env.VERCEL_PROJECT_PRODUCTION_URL =
    "genius-bat-phone.vercel.app";
});

afterEach(() => {
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
});

describe("call transcript email", () => {
  it("contains the required call metadata, transcript, and recording link", () => {
    const email = buildCallEmail(
      call,
      "initiator@example.com",
      call.transcript,
    );

    expect(email.html).toContain("Call Transcript");
    expect(email.html).toContain("Caller:");
    expect(email.html).toContain("initiator@example.com");
    expect(email.html).toContain("Destination:");
    expect(email.html).toContain("Destination Contact");
    expect(email.html).toContain("Phone Number:");
    expect(email.html).toContain("+12125550199");
    expect(email.html).toContain("Call Start Time:");
    expect(email.html).toContain("Call Duration:");
    expect(email.html).toContain("Caller:\nHello.");
    expect(email.html).toContain(
      "https://genius-bat-phone.vercel.app/calls/call-1",
    );
    expect(email.html).toContain("View call and recording");
    expect(email.html).not.toContain(
      "https://genius-bat-phone.vercel.app/api/calls/call-1/recording",
    );
    expect(email.html).not.toContain(
      "https://api.twilio.com/recordings/RE111",
    );
  });

  it("sends only to the initiating user and never to the destination", async () => {
    process.env.RESEND_FROM_EMAIL = "Bat Phone <transcripts@example.com>";
    const repo = repository();
    const sender: CallEmailSender = {
      send: vi.fn(async () => undefined),
    };

    await sendCallEmail(call, call.transcript, repo, sender);

    expect(repo.resolveUserEmail).toHaveBeenCalledWith("initiating-user");
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "initiator@example.com",
      }),
      expect.any(String),
    );
    expect(sender.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: call.destination_number }),
      expect.any(String),
    );
  });

  it("retries one failed email attempt and then succeeds", async () => {
    process.env.RESEND_FROM_EMAIL = "Bat Phone <transcripts@example.com>";
    const repo = repository();
    const sender: CallEmailSender = {
      send: vi
        .fn()
        .mockRejectedValueOnce(new Error("temporary"))
        .mockResolvedValueOnce(undefined),
    };

    await sendCallEmail(call, call.transcript, repo, sender);

    expect(sender.send).toHaveBeenCalledTimes(2);
    expect(repo.setEmailAttempt).toHaveBeenNthCalledWith(2, call.id, 2);
    expect(repo.markEmailSent).toHaveBeenCalledWith(call.id);
    expect(repo.markEmailFailed).not.toHaveBeenCalled();
  });

  it("marks email failed after two attempts without changing call content", async () => {
    process.env.RESEND_FROM_EMAIL = "Bat Phone <transcripts@example.com>";
    const repo = repository();
    const sender: CallEmailSender = {
      send: vi.fn(async () => {
        throw new Error("unavailable");
      }),
    };

    await sendCallEmail(call, call.transcript, repo, sender);

    expect(sender.send).toHaveBeenCalledTimes(2);
    expect(repo.markEmailFailed).toHaveBeenCalledWith(call.id);
    expect(call.transcript).toBe(
      "Caller:\nHello.\n\nDestination Contact:\nHi.",
    );
    expect(call.recording_url).toBe(
      "https://api.twilio.com/recordings/RE111",
    );
  });

  it("uses fallback transcript copy when no transcript is available", () => {
    const email = buildCallEmail(call, "initiator@example.com", null);

    expect(email.html).toContain(
      "Transcript unavailable. The call recording may still be available.",
    );
  });

  it("does not send when email was already sent", async () => {
    process.env.RESEND_FROM_EMAIL = "Bat Phone <transcripts@example.com>";
    const repo = repository();
    const sender: CallEmailSender = {
      send: vi.fn(async () => undefined),
    };

    await sendCallEmail(
      { ...call, email_status: "sent" },
      call.transcript,
      repo,
      sender,
    );

    expect(repo.claimEmail).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("does not send when another worker already claimed email delivery", async () => {
    process.env.RESEND_FROM_EMAIL = "Bat Phone <transcripts@example.com>";
    const repo = repository();
    vi.mocked(repo.claimEmail).mockResolvedValue(false);
    const sender: CallEmailSender = {
      send: vi.fn(async () => undefined),
    };

    await sendCallEmail(call, call.transcript, repo, sender);

    expect(repo.claimEmail).toHaveBeenCalledWith(call.id);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("marks email skipped when the initiating user has no recipient address", async () => {
    process.env.RESEND_FROM_EMAIL = "Bat Phone <transcripts@example.com>";
    const repo = repository();
    vi.mocked(repo.resolveUserEmail).mockResolvedValue(null);
    const sender: CallEmailSender = {
      send: vi.fn(async () => undefined),
    };

    await sendCallEmail(call, call.transcript, repo, sender);

    expect(repo.markEmailSkipped).toHaveBeenCalledWith(call.id);
    expect(sender.send).not.toHaveBeenCalled();
  });
});
