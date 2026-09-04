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
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        phone_number: phoneNumber,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (error) {
    console.error(
      JSON.stringify({
        event: "profiles.save_phone_failed",
        userId: user.id,
        code: error.code,
      }),
    );
    return {
      success: false,
      message: "Your phone number could not be saved. Please try again.",
    };
  }

  revalidatePath("/account");
  revalidatePath("/onboarding");
  return { success: true, data: undefined };
}
