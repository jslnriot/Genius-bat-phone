import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateDialResult: vi.fn(),
  validateTwilioRequest: vi.fn(),
}));

vi.mock("@/lib/twilio/request-validation", () => ({
  validateTwilioRequest: mocks.validateTwilioRequest,
}));

vi.mock("@/lib/twilio/telephony-repository", () => ({
  SupabaseTelephonyRepository: class {
    updateDialResult = mocks.updateDialResult;
  },
}));

vi.mock("@/lib/twilio/logging", () => ({
  logTwilioEvent: vi.fn(),
}));

import { POST } from "./route";

function request(params: Record<string, string>) {
  return new Request("https://genius-bat-phone.vercel.app/api/twilio/dial-complete", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateDialResult.mockResolvedValue(undefined);
});

describe("POST /api/twilio/dial-complete", () => {
  it.each([
    ["busy", undefined],
    ["no-answer", undefined],
    ["canceled", "0"],
    ["completed", "12"],
  ])(
    "persists DialCallStatus=%s and optional duration",
    async (dialStatus, dialDuration) => {
      const params: Record<string, string> = {
        CallSid: "CA11111111111111111111111111111111",
        DialCallStatus: dialStatus,
      };
      if (dialDuration !== undefined) {
        params.DialCallDuration = dialDuration;
      }
      mocks.validateTwilioRequest.mockResolvedValue({
        params: new URLSearchParams(params),
      });

      const response = await POST(request(params));

      expect(response.status).toBe(200);
      expect(mocks.updateDialResult).toHaveBeenCalledWith(
        "CA11111111111111111111111111111111",
        dialStatus,
        dialDuration === undefined ? undefined : Number(dialDuration),
      );
      const xml = await response.text();
      expect(xml).toContain("<Hangup");
    },
  );

  it("rejects an invalid signature before updating the call row", async () => {
    mocks.validateTwilioRequest.mockResolvedValue(null);

    const response = await POST(
      request({
        CallSid: "CA11111111111111111111111111111111",
        DialCallStatus: "completed",
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.updateDialResult).not.toHaveBeenCalled();
  });
});
