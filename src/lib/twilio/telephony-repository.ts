import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureCallRecord,
  type CreateCallInput,
  type DialableCall,
} from "@/lib/twilio/call-idempotency";
import type { MatchableContact } from "@/lib/twilio/contact-matching";
import { createAdminClient } from "@/utils/supabase/admin";

export type CallerProfile = {
  id: string;
};

export type { CreateCallInput, DialableCall };

export interface TelephonyRepository {
  findProfileByPhone(phoneNumber: string): Promise<CallerProfile | null>;
  listContacts(userId: string): Promise<MatchableContact[]>;
  createCallBeforeDial(input: CreateCallInput): Promise<DialableCall>;
  updateDialResult(
    callSid: string,
    status: string,
    duration?: number,
  ): Promise<void>;
  updateRecording(
    callSid: string,
    recordingSid: string,
    recordingUrl: string,
    recordingDuration?: number,
  ): Promise<void>;
}

const CALL_SELECT =
  "user_id, contact_id, contact_name_snapshot, destination_number, twilio_call_sid";

export class SupabaseTelephonyRepository implements TelephonyRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient = createAdminClient()) {
    this.supabase = supabase;
  }

  async findProfileByPhone(phoneNumber: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("phone_number", phoneNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async listContacts(userId: string) {
    const { data, error } = await this.supabase
      .from("contacts")
      .select("id, user_id, name, phone_number")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async findCallBySid(callSid: string) {
    const { data, error } = await this.supabase
      .from("calls")
      .select(CALL_SELECT)
      .eq("twilio_call_sid", callSid)
      .maybeSingle();

    if (error) throw error;
    return data as DialableCall | null;
  }

  async insertCallIgnoringDuplicate(input: CreateCallInput) {
    const { error } = await this.supabase.from("calls").upsert(input, {
      ignoreDuplicates: true,
      onConflict: "twilio_call_sid",
    });

    if (error) throw error;
  }

  async createCallBeforeDial(input: CreateCallInput) {
    return ensureCallRecord(
      {
        findByCallSid: (callSid) => this.findCallBySid(callSid),
        insertIgnoringDuplicate: (call) =>
          this.insertCallIgnoringDuplicate(call),
      },
      input,
    );
  }

  async updateDialResult(
    callSid: string,
    status: string,
    duration?: number,
  ) {
    const updates: { status: string; duration?: number } = { status };
    if (duration !== undefined) updates.duration = duration;

    const { error } = await this.supabase
      .from("calls")
      .update(updates)
      .eq("twilio_call_sid", callSid);

    if (error) throw error;
  }

  async updateRecording(
    callSid: string,
    recordingSid: string,
    recordingUrl: string,
    recordingDuration?: number,
  ) {
    const updates: {
      recording_sid: string;
      recording_url: string;
      recording_duration?: number;
    } = {
      recording_sid: recordingSid,
      recording_url: recordingUrl,
    };
    if (recordingDuration !== undefined) {
      updates.recording_duration = recordingDuration;
    }

    const { error } = await this.supabase
      .from("calls")
      .update(updates)
      .eq("twilio_call_sid", callSid);

    if (error) throw error;
  }
}
