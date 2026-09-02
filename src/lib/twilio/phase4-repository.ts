import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";

export type Phase4Call = {
  id: string;
  user_id: string;
  contact_name_snapshot: string | null;
  destination_number: string | null;
  start_time: string | null;
  duration: number | null;
  recording_sid: string | null;
  recording_url: string | null;
  recording_duration: number | null;
  transcript: string | null;
  transcription_id: string | null;
  transcription_status: string | null;
  transcription_attempts: number;
  email_status: string | null;
  email_attempts: number;
  email_sent_at: string | null;
};

const PHASE4_CALL_SELECT = [
  "id",
  "user_id",
  "contact_name_snapshot",
  "destination_number",
  "start_time",
  "duration",
  "recording_sid",
  "recording_url",
  "recording_duration",
  "transcript",
  "transcription_id",
  "transcription_status",
  "transcription_attempts",
  "email_status",
  "email_attempts",
  "email_sent_at",
].join(", ");

export interface Phase4Repository {
  findCallByRecordingSid(recordingSid: string): Promise<Phase4Call | null>;
  claimTranscription(callId: string): Promise<boolean>;
  setTranscriptionAttempt(callId: string, attempt: number): Promise<void>;
  markTranscriptionSubmitted(
    callId: string,
    transcriptionId: string,
  ): Promise<void>;
  markTranscriptionFailed(
    callId: string,
    transcriptionId?: string,
  ): Promise<void>;
  storeCompletedTranscription(
    callId: string,
    transcriptionId: string,
    transcript: string,
  ): Promise<void>;
  claimEmail(callId: string): Promise<boolean>;
  setEmailAttempt(callId: string, attempt: number): Promise<void>;
  markEmailSent(callId: string): Promise<void>;
  markEmailFailed(callId: string): Promise<void>;
  markEmailSkipped(callId: string): Promise<void>;
  resolveUserEmail(userId: string): Promise<string | null>;
}

export class SupabasePhase4Repository implements Phase4Repository {
  constructor(
    private readonly supabase: SupabaseClient = createAdminClient(),
  ) {}

  async findCallByRecordingSid(recordingSid: string) {
    const { data, error } = await this.supabase
      .from("calls")
      .select(PHASE4_CALL_SELECT)
      .eq("recording_sid", recordingSid)
      .maybeSingle();

    if (error) throw error;
    return data as Phase4Call | null;
  }

  async claimTranscription(callId: string) {
    const { data, error } = await this.supabase
      .from("calls")
      .update({ transcription_status: "pending" })
      .eq("id", callId)
      .is("transcription_id", null)
      .is("transcription_status", null)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  async setTranscriptionAttempt(callId: string, attempt: number) {
    const { error } = await this.supabase
      .from("calls")
      .update({ transcription_attempts: attempt })
      .eq("id", callId);

    if (error) throw error;
  }

  async markTranscriptionSubmitted(
    callId: string,
    transcriptionId: string,
  ) {
    const { error } = await this.supabase
      .from("calls")
      .update({
        transcription_id: transcriptionId,
        transcription_status: "pending",
      })
      .eq("id", callId);

    if (error) throw error;
  }

  async markTranscriptionFailed(
    callId: string,
    transcriptionId?: string,
  ) {
    const updates: {
      transcription_id?: string;
      transcription_status: "failed";
    } = { transcription_status: "failed" };
    if (transcriptionId) updates.transcription_id = transcriptionId;

    const { error } = await this.supabase
      .from("calls")
      .update(updates)
      .eq("id", callId);

    if (error) throw error;
  }

  async storeCompletedTranscription(
    callId: string,
    transcriptionId: string,
    transcript: string,
  ) {
    const { error } = await this.supabase
      .from("calls")
      .update({
        transcript,
        transcription_id: transcriptionId,
        transcription_status: "completed",
      })
      .eq("id", callId);

    if (error) throw error;
  }

  async claimEmail(callId: string) {
    const { data, error } = await this.supabase
      .from("calls")
      .update({ email_status: "pending" })
      .eq("id", callId)
      .is("email_status", null)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  async setEmailAttempt(callId: string, attempt: number) {
    const { error } = await this.supabase
      .from("calls")
      .update({ email_attempts: attempt })
      .eq("id", callId);

    if (error) throw error;
  }

  async markEmailSent(callId: string) {
    const { error } = await this.supabase
      .from("calls")
      .update({
        email_sent_at: new Date().toISOString(),
        email_status: "sent",
      })
      .eq("id", callId);

    if (error) throw error;
  }

  async markEmailFailed(callId: string) {
    const { error } = await this.supabase
      .from("calls")
      .update({ email_status: "failed" })
      .eq("id", callId);

    if (error) throw error;
  }

  async markEmailSkipped(callId: string) {
    const { error } = await this.supabase
      .from("calls")
      .update({ email_status: "skipped" })
      .eq("id", callId);

    if (error) throw error;
  }

  async resolveUserEmail(userId: string) {
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (typeof profile?.email === "string" && profile.email.length > 0) {
      return profile.email;
    }

    const { data, error } =
      await this.supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    return data.user?.email ?? null;
  }
}
