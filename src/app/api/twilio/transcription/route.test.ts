import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findCallByRecordingSid: vi.fn(),
  handleTranscriptionCallback: vi.fn(),
  validateTwilioJsonRequest: vi.fn(),
}));

vi.mock("@/lib/twilio/request-validation", () => ({
  validateTwilioJsonRequest: mocks.validateTwilioJsonRequest,
}));

vi.mock("@/lib/twilio/phase4-repository", () => ({
  SupabasePhase4Repository: class {
    findCallByRecordingSid = mocks.findCallByRecordingSid;
  },
}));

vi.mock("@/lib/twilio/batch-transcription", () => ({
  parseTranscriptionCallback: (value: unknown) => value,
  handleTranscriptionCallback: mocks.handleTranscriptionCallback,
}));

vi.mock("@/lib/email/call-transcript", () => ({
  ResendCallEmailSender: class {},
}));

vi.mock("@/lib/twilio/logging", () => ({
  logTwilioEvent: vi.fn(),
}));

import { POST } from "./route";

const payload = {
  id: "voice_transcription_123",
  sourceId: "RE11111111111111111111111111111111",
  status: "completed",
  sentences: [{ text: "Hello." }],
};

function request() {
  return new Request(
    "https://genius-bat-phone.vercel.app/api/twilio/transcription",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.validateTwilioJsonRequest.mockResolvedValue({
    rawBody: JSON.stringify(payload),
  });
  mocks.findCallByRecordingSid.mockResolvedValue({ id: "call-1" });
  mocks.handleTranscriptionCallback.mockResolvedValue(undefined);
});

describe("POST /api/twilio/transcription", () => {
  it("correlates callback sourceId to calls.recording_sid", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.findCallByRecordingSid).toHaveBeenCalledWith(
      payload.sourceId,
    );
    expect(mocks.handleTranscriptionCallback).toHaveBeenCalledOnce();
  });

  it("rejects an invalid signature before database access", async () => {
    mocks.validateTwilioJsonRequest.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.findCallByRecordingSid).not.toHaveBeenCalled();
    expect(mocks.handleTranscriptionCallback).not.toHaveBeenCalled();
  });
});
