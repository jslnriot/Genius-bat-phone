import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasContacts(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
) {
  const { data, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  return !error && (data?.length ?? 0) > 0;
}

export async function resolveDefaultAppPath(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  callingNumber: string | null,
) {
  if (!callingNumber) {
    return "/onboarding";
  }

  const contactsExist = await hasContacts(supabase, userId);
  return contactsExist ? "/calls" : "/contacts";
}
