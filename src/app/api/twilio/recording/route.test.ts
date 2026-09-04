import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findCallByRecordingSid: vi.fn(),
  submitRecordingForTranscription: vi.fn(),
  updateRecording: vi.fn(),
  validateTwilioRequest: vi.fn(),
}));

vi.mock("@/lib/twilio/request-validation", () => ({
  validateTwilioRequest: mocks.validateTwilioRequest,
}));

vi.mock("@/lib/twilio/telephony-repository", () => ({
  SupabaseTelephonyRepository: class {
    updateRecording = mocks.updateRecording;
  },
}));

vi.mock("@/lib/twilio/phase4-repository", () => ({
  SupabasePhase4Repository: class {
    findCallByRecordingSid = mocks.findCallByRecordingSid;
  },
}));

vi.mock("@/lib/twilio/batch-transcription", () => ({
  submitRecordingForTranscription: mocks.submitRecordingForTranscription,
  TwilioBatchTranscriptionClient: class {},
}));

vi.mock("@/lib/email/call-transcript", () => ({
  ResendCallEmailSender: class {},
}));

vi.mock("@/lib/twilio/logging", () => ({
  logTwilioEvent: vi.fn(),
}));

import { POST } from "./route";

const callSid = "CA11111111111111111111111111111111";
const recordingSid = "RE11111111111111111111111111111111";

function request(params: Record<string, string>) {
  return new Request("https://genius-bat-phone.vercel.app/api/twilio/recording", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateRecording.mockResolvedValue(undefined);
  mocks.findCallByRecordingSid.mockResolvedValue({ id: "call-1" });
  mocks.submitRecordingForTranscription.mockResolvedValue(undefined);
});

describe("POST /api/twilio/recording", () => {
  it("ignores non-completed recording callbacks", async () => {
    mocks.validateTwilioRequest.mockResolvedValue({
      params: new URLSearchParams({
        CallSid: callSid,
        RecordingStatus: "in-progress",
      }),
    });

    const response = await POST(
      request({
        CallSid: callSid,
        RecordingStatus: "in-progress",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateRecording).not.toHaveBeenCalled();
    expect(mocks.submitRecordingForTranscription).not.toHaveBeenCalled();
  });

  it("accepts a zero-duration completed recording and starts transcription", async () => {
    mocks.validateTwilioRequest.mockResolvedValue({
      params: new URLSearchParams({
        CallSid: callSid,
        RecordingDuration: "0",
        RecordingSid: recordingSid,
        RecordingStatus: "completed",
        RecordingUrl: "https://api.twilio.com/recording/RE111",
      }),
    });

    const response = await POST(
      request({
        CallSid: callSid,
        RecordingDuration: "0",
        RecordingSid: recordingSid,
        RecordingStatus: "completed",
        RecordingUrl: "https://api.twilio.com/recording/RE111",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateRecording).toHaveBeenCalledWith(
      callSid,
      recordingSid,
      "https://api.twilio.com/recording/RE111",
      0,
    );
    expect(mocks.findCallByRecordingSid).toHaveBeenCalledWith(recordingSid);
    expect(mocks.submitRecordingForTranscription).toHaveBeenCalledOnce();
  });
});
