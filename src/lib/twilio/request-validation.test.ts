import { afterEach, describe, expect, it } from "vitest";
import twilio from "twilio";
import {
  externallyVisibleUrl,
  validateTwilioJsonRequest,
} from "./request-validation";

const authToken = "test-auth-token";
const body = JSON.stringify({
  id: "voice_transcription_123",
  sourceId: "RE111",
  status: "completed",
});

function signedRequest(signature: string) {
  const bodyHash = twilio.getExpectedBodyHash(body);
  return new Request(
    `http://localhost:3000/api/twilio/transcription?bodySHA256=${bodyHash}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-host": "genius-bat-phone.vercel.app",
        "x-forwarded-proto": "https",
        "x-twilio-signature": signature,
      },
      body,
    },
  );
}

afterEach(() => {
  delete process.env.TWILIO_AUTH_TOKEN;
});

describe("Twilio JSON request validation", () => {
  it("validates the raw JSON body and externally visible URL", async () => {
    process.env.TWILIO_AUTH_TOKEN = authToken;
    const unsignedRequest = signedRequest("placeholder");
    const url = externallyVisibleUrl(unsignedRequest);
    const signature = twilio.getExpectedTwilioSignature(authToken, url, {});

    const validated = await validateTwilioJsonRequest(
      signedRequest(signature),
    );

    expect(validated).toEqual({ rawBody: body });
    expect(url).toContain(
      "https://genius-bat-phone.vercel.app/api/twilio/transcription?bodySHA256=",
    );
  });

  it("rejects an invalid JSON webhook signature", async () => {
    process.env.TWILIO_AUTH_TOKEN = authToken;

    await expect(
      validateTwilioJsonRequest(signedRequest("invalid")),
    ).resolves.toBeNull();
  });
});
