import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTwilioRecordingMedia } from "./recording-media";

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
