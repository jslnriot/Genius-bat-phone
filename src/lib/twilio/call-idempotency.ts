export type DialableCall = {
  contact_id: string | null;
  contact_name_snapshot: string;
  destination_number: string;
  twilio_call_sid: string;
  user_id: string;
};

export type CreateCallInput = DialableCall & {
  start_time: string;
  status: "in_progress";
};

export type CallStorage = {
  findByCallSid(callSid: string): Promise<DialableCall | null>;
  insertIgnoringDuplicate(input: CreateCallInput): Promise<void>;
};

export async function ensureCallRecord(
  storage: CallStorage,
  input: CreateCallInput,
) {
  const existing = await storage.findByCallSid(input.twilio_call_sid);
  if (existing) return existing;

  await storage.insertIgnoringDuplicate(input);

  const saved = await storage.findByCallSid(input.twilio_call_sid);
  if (!saved) {
    throw new Error("Call record was not available after idempotent insert.");
  }

  return saved;
}
