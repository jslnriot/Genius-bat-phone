"use server";

import { revalidatePath } from "next/cache";
import {
  type ActionResult,
  validateProfilePhone,
} from "@/lib/contact-validation";
import { createClient } from "@/utils/supabase/server";

export async function saveProfilePhone(
  phoneNumber: string,
): Promise<ActionResult> {
  const phoneError = validateProfilePhone(phoneNumber);
  if (phoneError) {
    return {
      success: false,
      message: "Check the highlighted field.",
      fieldErrors: { phoneNumber: phoneError },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Sign in again to continue." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ phone_number: phoneNumber })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      message: "Your phone number could not be saved. Please try again.",
    };
  }

  revalidatePath("/account");
  return { success: true, data: undefined };
}
