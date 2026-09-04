import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteTwilioRecording,
  fetchTwilioRecordingMedia,
} from "./recording-media";

afterEach(() => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
});

describe("fetchTwilioRecordingMedia", () => {
  it("requests MP3 media with server-side Basic authentication", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "twilio-secret";
    const fetcher = vi.fn(async () => new Response("mp3"));

    await fetchTwilioRecordingMedia("REtest", fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.twilio.com/2010-04-01/Accounts/ACtest/Recordings/REtest.mp3",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            "ACtest:twilio-secret",
          ).toString("base64")}`,
        },
      },
    );
  });
});

describe("deleteTwilioRecording", () => {
  it("deletes the Twilio recording with server-side Basic authentication", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "twilio-secret";
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));

    const result = await deleteTwilioRecording("REtest", fetcher);

    expect(result).toEqual({ success: true });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.twilio.com/2010-04-01/Accounts/ACtest/Recordings/REtest",
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(
            "ACtest:twilio-secret",
          ).toString("base64")}`,
        },
      },
    );
  });

  it("treats a missing Twilio recording as already deleted", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "twilio-secret";
    const fetcher = vi.fn(async () => new Response(null, { status: 404 }));

    const result = await deleteTwilioRecording("REmissing", fetcher);

    expect(result).toEqual({ success: true });
  });

  it("returns failure for unexpected Twilio responses", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "twilio-secret";
    const fetcher = vi.fn(async () => new Response(null, { status: 500 }));

    const result = await deleteTwilioRecording("REtest", fetcher);

    expect(result).toEqual({ success: false, status: 500 });
  });
});
