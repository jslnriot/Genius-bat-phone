import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountCounts = {
  contactCount: number;
  callCount: number;
};

function normalizeCount(value: number | null | undefined) {
  return typeof value === "number" && value >= 0 ? value : 0;
}

export async function getAccountCounts(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
): Promise<AccountCounts> {
  const [contactsResult, callsResult] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    contactCount: contactsResult.error
      ? 0
      : normalizeCount(contactsResult.count),
    callCount: callsResult.error ? 0 : normalizeCount(callsResult.count),
  };
}
