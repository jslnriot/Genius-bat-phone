import { redirect } from "next/navigation";
import { Phone } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function CallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
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

      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-muted-background)]">
          <Phone size={32} className="text-[var(--color-secondary-text)]" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-medium text-[var(--color-primary)]">
            No calls yet
          </p>
          <p className="text-sm text-[var(--color-secondary-text)]">
            Your call history will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
