"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult } from "@/lib/contact-validation";
import { deleteTwilioRecording } from "@/lib/twilio/recording-media";
import { createClient } from "@/utils/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function deleteCall(callId: string): Promise<ActionResult> {
  if (!UUID_PATTERN.test(callId)) {
    return { success: false, message: "This call could not be deleted." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Sign in again to delete a call." };
  }

  const { data: call, error: lookupError } = await supabase
    .from("calls")
    .select("id, recording_sid")
    .eq("id", callId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error(
      JSON.stringify({
        event: "calls.delete_lookup_failed",
        callId,
        userId: user.id,
      }),
    );
    return {
      success: false,
      message: "This call could not be deleted. Please try again.",
    };
  }

  if (!call) {
    return { success: false, message: "This call could not be deleted." };
  }

  if (call.recording_sid) {
    try {
      const twilioResult = await deleteTwilioRecording(call.recording_sid);
      if (!twilioResult.success) {
        console.error(
          JSON.stringify({
            event: "calls.delete_twilio_failed",
            callId,
            userId: user.id,
            recordingSid: call.recording_sid,
            status: twilioResult.status,
          }),
        );
        return {
          success: false,
          message: "This call could not be deleted. Please try again.",
        };
      }
    } catch {
      console.error(
        JSON.stringify({
          event: "calls.delete_twilio_failed",
          callId,
          userId: user.id,
          recordingSid: call.recording_sid,
        }),
      );
      return {
        success: false,
        message: "This call could not be deleted. Please try again.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("calls")
    .delete()
    .eq("id", callId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error(
      JSON.stringify({
        event: "calls.delete_row_failed",
        callId,
        userId: user.id,
      }),
    );
    return {
      success: false,
      message: "This call could not be deleted. Please try again.",
    };
  }

  revalidatePath("/calls");
  revalidatePath(`/calls/${callId}`);
  redirect("/calls");
}
