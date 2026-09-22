import type { SupabaseClient } from "@supabase/supabase-js";

export function isMainAppPath(pathname: string) {
  return (
    pathname === "/contacts" ||
    pathname.startsWith("/contacts/") ||
    pathname === "/calls" ||
    pathname.startsWith("/calls/")
  );
}

export async function getCallingNumber(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", userId)
    .maybeSingle();

  const phoneNumber = data?.phone_number;
  return typeof phoneNumber === "string" ? phoneNumber : null;
}
