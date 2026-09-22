"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { e164ToDisplayPhone } from "@/lib/contact-validation";

type BatPhoneCallUtilityProps = {
  batPhoneNumber: string;
};

export function BatPhoneCallUtility({
  batPhoneNumber,
}: BatPhoneCallUtilityProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(batPhoneNumber);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section
      aria-label="Call Bat Phone"
      className="flex flex-col gap-2 rounded-(--radius-card) border border-action/30 bg-action/[0.07] p-3 shadow-[0_1px_2px_rgba(37,99,235,0.08)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-primary">
            Bat Phone
          </p>
          <p className="text-base font-semibold leading-6 text-primary">
            {e164ToDisplayPhone(batPhoneNumber)}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 shrink-0 gap-2 border-action/30 bg-white/90 px-3 text-action hover:bg-white hover:text-action"
          onClick={handleCopy}
        >
          <Copy aria-hidden="true" size={18} />
          Copy
        </Button>
      </div>
      <p className="text-sm leading-5 text-secondary-text">
      Call this number from your registered phone. When prompted, say a contact&apos;s name.
      </p>
      {copyStatus !== "idle" ? (
        <p role="status" className="text-xs leading-4 text-secondary-text">
          {copyStatus === "copied"
            ? "Copied"
            : "The number could not be copied. Please copy it from the screen."}
        </p>
      ) : null}
    </section>
  );
}
