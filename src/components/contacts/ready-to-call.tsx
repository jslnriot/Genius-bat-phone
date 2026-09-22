"use client";

import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { e164ToDisplayPhone } from "@/lib/contact-validation";

type ReadyToCallProps = {
  batPhoneNumber: string;
};

export function ReadyToCall({ batPhoneNumber }: ReadyToCallProps) {
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
    <Card className="flex flex-col gap-3 border-action/30 bg-action/[0.07] shadow-[0_1px_2px_rgba(37,99,235,0.08)]">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-3 text-base font-semibold leading-6 text-primary">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-button) bg-white/80"
          >
            <Phone size={18} className="text-action" />
          </span>
          Ready to make a call?
        </h2>
        <p className="text-sm leading-5 text-secondary-text">
          Call Bat Phone from your registered phone:
        </p>
      </div>
      <p className="text-base font-semibold leading-6 text-primary">
        {e164ToDisplayPhone(batPhoneNumber)}
      </p>
      <p className="text-sm leading-5 text-secondary-text">
        When prompted, say the name of one of your contacts.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-3 border-action/30 bg-action/10 text-action hover:bg-action/15 hover:text-action"
        onClick={handleCopy}
      >
        <Copy aria-hidden="true" size={20} />
        Copy number
      </Button>
      {copyStatus !== "idle" ? (
        <p role="status" className="text-xs leading-4 text-secondary-text">
          {copyStatus === "copied"
            ? "Copied"
            : "The number could not be copied. Please copy it from the screen."}
        </p>
      ) : null}
      <p className="text-xs leading-4 text-secondary-text">
        Make sure you’re calling from the number registered in Account.
      </p>
    </Card>
  );
}
