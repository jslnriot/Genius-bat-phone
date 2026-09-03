import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { CallHistory } from "@/components/calls/call-history";
import type { CallRecord } from "@/lib/calls";
import { createClient } from "@/utils/supabase/server";

const CALL_HISTORY_SELECT =
  "id, contact_name_snapshot, destination_number, status, start_time, duration, recording_sid, recording_duration, transcript, transcription_status";

export default async function CallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const { data, error } = await supabase
    .from("calls")
    .select(CALL_HISTORY_SELECT)
    .eq("user_id", user.id)
    .order("start_time", { ascending: false, nullsFirst: false });

  if (error) {
    console.error(
      JSON.stringify({
        event: "calls.history_lookup_failed",
        userId: user.id,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[34px] text-[var(--color-primary)]">
          Calls
        </h1>
        <p className="text-sm text-[var(--color-secondary-text)]">
          Your call history and recordings.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="flex gap-3 rounded-(--radius-card) border border-border bg-white p-4"
        >
          <AlertCircle
            aria-hidden="true"
            size={20}
            className="mt-0.5 shrink-0 text-error"
          />
          <div>
            <p className="font-medium text-primary">
              Call history is temporarily unavailable.
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              Please try again in a moment.
            </p>
          </div>
        </div>
      ) : (
        <CallHistory calls={(data ?? []) as CallRecord[]} />
      )}
    </div>
  );
}
