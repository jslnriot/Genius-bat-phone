import { describe, expect, it, vi } from "vitest";
import type { MatchableContact } from "./contact-matching";
import type { TelephonyRepository } from "./telephony-repository";
import { incomingCallTwiml, resolveContactTwiml } from "./voice-flow";

const profile = { id: "9fd1a99e-7ff7-4a09-91d0-bdbf50a6f76a" };
const ada: MatchableContact = {
  id: "97d0a5cd-8742-4059-a821-e57568050bb7",
  name: "Ada Lovelace",
  phone_number: "+12125550199",
  user_id: profile.id,
};

function repository(
  overrides: Partial<TelephonyRepository> = {},
): TelephonyRepository {
  return {
    createCallBeforeDial: async (input) => input,
    findProfileByPhone: async () => profile,
    listContacts: async () => [ada],
    updateDialResult: async () => undefined,
    updateRecording: async () => undefined,
    ...overrides,
  };
}

describe("Twilio voice flow", () => {
  it("returns a speech and DTMF Gather for a registered caller", async () => {
    const xml = await incomingCallTwiml("+14165550100", repository());

    expect(xml).toContain("<Gather");
    expect(xml).toContain('input="speech dtmf"');
    expect(xml).toContain(
      'action="/api/twilio/resolve-contact?attempt=0"',
    );
    expect(xml).toContain('hints="Ada Lovelace"');
    expect(xml).toContain("Who would you like to call?");
    expect(xml).toContain("press 1 for Ada Lovelace");
  });

  it("rejects an unknown caller with valid TwiML", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const xml = await incomingCallTwiml(
      "+14165550100",
      repository({ findProfileByPhone: async () => null }),
    );

    expect(xml).toContain("<Response>");
    expect(xml).toContain(
      "This phone number is not registered with Bat Phone.",
    );
    expect(xml).toContain("<Hangup");
    expect(xml).not.toContain("<Gather");
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"event":"twilio.unknown_caller_rejected"'),
    );
    expect(log.mock.calls[0][0]).not.toContain("+14165550100");
    log.mockRestore();
  });

  it("retries an unresolved contact once, retains DTMF, then exits", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const firstAttempt = await resolveContactTwiml(
      {
        attempt: 0,
        callSid: "CA11111111111111111111111111111111",
        from: "+14165550100",
        speechResult: "Not A Contact",
        twilioPhoneNumber: "+12892782417",
      },
      repository(),
    );
    const finalAttempt = await resolveContactTwiml(
      {
        attempt: 1,
        callSid: "CA11111111111111111111111111111111",
        from: "+14165550100",
        speechResult: "Still Not A Contact",
        twilioPhoneNumber: "+12892782417",
      },
      repository(),
    );

    expect(firstAttempt).toContain(
      'action="/api/twilio/resolve-contact?attempt=1"',
    );
    expect(firstAttempt).toContain('input="speech dtmf"');
    expect(finalAttempt).toContain("I could not resolve that contact.");
    expect(finalAttempt).toContain("<Hangup");
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"outcome":"retry"'),
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"outcome":"hangup"'),
    );
    expect(log.mock.calls.flat().join(" ")).not.toContain("Not A Contact");
    log.mockRestore();
  });

  it("creates the call record and returns the configured Dial response", async () => {
    const createCallBeforeDial = vi.fn(async (input) => input);
    const xml = await resolveContactTwiml(
      {
        attempt: 0,
        callSid: "CA11111111111111111111111111111111",
        from: "+14165550100",
        speechResult: "Ada Lovelace",
        twilioPhoneNumber: "+12892782417",
      },
      repository({ createCallBeforeDial }),
    );

    expect(createCallBeforeDial).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_id: ada.id,
        contact_name_snapshot: ada.name,
        destination_number: ada.phone_number,
        status: "in_progress",
        twilio_call_sid: "CA11111111111111111111111111111111",
        user_id: profile.id,
      }),
    );
    expect(xml).toContain("<Dial");
    expect(xml).toContain('callerId="+12892782417"');
    expect(xml).toContain('answerOnBridge="true"');
    expect(xml).toContain('record="record-from-answer-dual"');
    expect(xml).toContain(
      'recordingStatusCallback="/api/twilio/recording"',
    );
    expect(xml).toContain('action="/api/twilio/dial-complete"');
    expect(xml).toContain(ada.phone_number);
  });
});
