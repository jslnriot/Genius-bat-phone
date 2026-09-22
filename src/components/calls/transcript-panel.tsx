"use client";

import { useState } from "react";
import { Check, Copy, FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

type TranscriptPanelProps = {
  copyText?: string | null;
  children: React.ReactNode;
};

export function TranscriptPanel({ copyText, children }: TranscriptPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const canCopy = Boolean(copyText?.trim());

  async function handleCopy() {
    if (!copyText?.trim()) return;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section
      aria-labelledby="transcript-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="transcript-heading"
          className="flex items-center gap-3 text-xl font-semibold leading-7 text-primary"
        >
          <FileText aria-hidden="true" size={20} />
          Transcript
        </h2>
        {canCopy ? (
          <Tooltip
            label={copyStatus === "copied" ? "Copied" : "Copy transcript"}
          >
            <button
              type="button"
              aria-label={
                copyStatus === "copied" ? "Transcript copied" : "Copy transcript"
              }
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-(--radius-button) px-2 text-sm font-medium text-secondary-text transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
              onClick={handleCopy}
            >
              {copyStatus === "copied" ? (
                <Check aria-hidden="true" size={20} className="text-success" />
              ) : (
                <Copy aria-hidden="true" size={20} />
              )}
              Copy
            </button>
          </Tooltip>
        ) : null}
      </div>
      {copyStatus !== "idle" ? (
        <p role="status" className="text-xs leading-4 text-secondary-text">
          {copyStatus === "copied"
            ? "Copied"
            : "The transcript could not be copied."}
        </p>
      ) : null}
      <div
        aria-label="Call transcript"
        className="rounded-(--radius-card) border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
      >
        {children}
      </div>
    </section>
  );
}
