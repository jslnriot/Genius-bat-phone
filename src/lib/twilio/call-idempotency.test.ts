import { describe, expect, it, vi } from "vitest";
import {
  ensureCallRecord,
  type CreateCallInput,
  type DialableCall,
} from "./call-idempotency";

const input: CreateCallInput = {
  contact_id: "97d0a5cd-8742-4059-a821-e57568050bb7",
  contact_name_snapshot: "Ada Lovelace",
  destination_number: "+12125550199",
  start_time: "2026-09-02T18:00:00.000Z",
  status: "in_progress",
  twilio_call_sid: "CA11111111111111111111111111111111",
  user_id: "9fd1a99e-7ff7-4a09-91d0-bdbf50a6f76a",
};

describe("ensureCallRecord", () => {
  it("does not insert a duplicate call when Twilio retries", async () => {
    const calls = new Map<string, DialableCall>();
    const insertIgnoringDuplicate = vi.fn(
      async (call: CreateCallInput) => {
        if (!calls.has(call.twilio_call_sid)) {
          calls.set(call.twilio_call_sid, call);
        }
      },
    );
    const storage = {
      findByCallSid: async (callSid: string) => calls.get(callSid) ?? null,
      insertIgnoringDuplicate,
    };

    const first = await ensureCallRecord(storage, input);
    const second = await ensureCallRecord(storage, {
      ...input,
      destination_number: "+14155550100",
    });

    expect(insertIgnoringDuplicate).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(second.destination_number).toBe("+12125550199");
  });
});
