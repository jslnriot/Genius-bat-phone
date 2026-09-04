"use client";

import { useState } from "react";
import { Check, ClipboardCopy, FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

type TranscriptPanelProps = {
  copyText?: string | null;
  children: React.ReactNode;
};

export function TranscriptPanel({ copyText, children }: TranscriptPanelProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(copyText?.trim());

  async function handleCopy() {
    if (!copyText?.trim()) return;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="transcript-heading"
      className="space-y-4 border-t border-[var(--color-border)] pt-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="transcript-heading"
          className="flex items-center gap-2 text-xl font-semibold leading-7 text-[var(--color-primary)]"
        >
          <FileText aria-hidden="true" size={20} />
          Transcript
        </h2>
        {canCopy ? (
          <Tooltip label={copied ? "Copied!" : "Copy transcript"}>
            <button
              type="button"
              aria-label={copied ? "Transcript copied" : "Copy transcript"}
              className="text-secondary-text hover:text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)] focus-visible:ring-offset-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check aria-hidden="true" size={20} className="text-success" />
              ) : (
                <ClipboardCopy aria-hidden="true" size={20} />
              )}
            </button>
          </Tooltip>
        ) : null}
      </div>
      <div
        aria-label="Call transcript"
        className="max-h-72 overflow-y-auto rounded-(--radius-card) border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        tabIndex={0}
      >
        {children}
      </div>
    </section>
  );
}
