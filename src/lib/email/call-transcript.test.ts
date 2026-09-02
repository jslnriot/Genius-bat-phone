import { describe, expect, it, vi } from "vitest";
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
    expect(email.html).toContain(call.recording_url);
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
});
