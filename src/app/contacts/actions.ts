"use server";

import { revalidatePath } from "next/cache";
import {
  type ActionResult,
  type ContactRecord,
  validateContactInput,
} from "@/lib/contact-validation";
import { createClient } from "@/utils/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function createContact(
  name: string,
  phoneNumber: string,
): Promise<ActionResult<ContactRecord>> {
  const validation = validateContactInput(name, phoneNumber);
  if (!validation.isValid) {
    return {
      success: false,
      message: "Check the highlighted fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, message: "Sign in again to add a contact." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name: validation.name,
      phone_number: validation.phoneNumber,
    })
    .select("id, name, phone_number, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: "This contact could not be added. Please try again.",
    };
  }

  revalidatePath("/contacts");
  return { success: true, data };
}

export async function updateContact(
  contactId: string,
  name: string,
  phoneNumber: string,
): Promise<ActionResult<ContactRecord>> {
  const validation = validateContactInput(name, phoneNumber);
  if (!UUID_PATTERN.test(contactId) || !validation.isValid) {
    return {
      success: false,
      message: "Check the highlighted fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, message: "Sign in again to update a contact." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      name: validation.name,
      phone_number: validation.phoneNumber,
    })
    .eq("id", contactId)
    .eq("user_id", user.id)
    .select("id, name, phone_number, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: "This contact could not be updated. Please try again.",
    };
  }

  revalidatePath("/contacts");
  return { success: true, data };
}

export async function deleteContact(
  contactId: string,
): Promise<ActionResult> {
  if (!UUID_PATTERN.test(contactId)) {
    return { success: false, message: "This contact could not be deleted." };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, message: "Sign in again to delete a contact." };
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      message: "This contact could not be deleted. Please try again.",
    };
  }

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}
