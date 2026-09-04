import { notFound, redirect } from "next/navigation";
import { CallDetail } from "@/components/calls/call-detail";
import { CALL_RECORD_SELECT, type CallRecord } from "@/lib/calls";
import { resolveSafeReturnPath } from "@/lib/safe-return-path";
import { createClient } from "@/utils/supabase/server";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const returnTo = resolveSafeReturnPath(`/calls/${id}`);
    redirect(returnTo ? `/account?next=${encodeURIComponent(returnTo)}` : "/account");
  }

  const { data: call, error } = await supabase
    .from("calls")
    .select(CALL_RECORD_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      JSON.stringify({
        event: "calls.detail_lookup_failed",
        callId: id,
        userId: user.id,
      }),
    );
  }

  // RLS and the explicit owner filter intentionally make missing and non-owned
  // calls indistinguishable.
  if (error || !call) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <CallDetail
      call={call as CallRecord}
      callerPhoneNumber={profile?.phone_number ?? null}
    />
  );
}
