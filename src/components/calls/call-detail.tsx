import Link from "next/link";
import { ArrowLeft, FileText, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatCallDetailTime,
  formatCallDuration,
  getCallDuration,
  getCallStatus,
  parseTranscript,
  type CallRecord,
} from "@/lib/calls";
import { e164ToDisplayPhone } from "@/lib/contact-validation";
import { CallDelete } from "@/components/calls/call-delete";

function Transcript({ call }: { call: CallRecord }) {
  if (
    call.transcription_status === "pending" ||
    call.transcription_status === "processing"
  ) {
    return (
      <div role="status" className="space-y-1">
        <p className="text-base font-medium text-[var(--color-primary)]">
          Transcription in progress
        </p>
        <p className="text-sm text-[var(--color-secondary-text)]">
          The transcript will appear here when it’s ready.
        </p>
      </div>
    );
  }

  if (call.transcription_status === "failed") {
    return (
      <div className="space-y-1">
        <p className="text-base font-medium text-[var(--color-primary)]">
          Transcript unavailable
        </p>
        {call.recording_sid && (
          <p className="text-sm text-[var(--color-secondary-text)]">
            The recording is still available above.
          </p>
        )}
      </div>
    );
  }

  if (!call.transcript?.trim()) {
    return (
      <p className="text-base text-[var(--color-secondary-text)]">
        No transcript was created for this call.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {parseTranscript(call.transcript).map((section, index) => (
        <div key={`${section.speaker ?? "text"}-${index}`}>
          {section.speaker && (
            <p className="mb-1 break-words text-sm font-semibold text-[var(--color-primary)]">
              {section.speaker}
            </p>
          )}
          <p className="break-words whitespace-pre-wrap text-base leading-6 text-[var(--color-primary)]">
            {section.text}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CallDetail({ call }: { call: CallRecord }) {
  const status = getCallStatus(call);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/calls"
          className="-ml-2 flex min-h-11 w-fit items-center gap-2 rounded-md px-2 text-sm font-medium text-[var(--color-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)]"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Calls
        </Link>
        <div className="space-y-2">
          <h1 className="break-words text-[28px] font-bold leading-[34px] text-[var(--color-primary)]">
            Call with {call.contact_name_snapshot ?? "Unknown contact"}
          </h1>
          <p className="text-base text-[var(--color-secondary-text)]">
            {formatCallDetailTime(call.start_time)}
          </p>
          <div className="flex flex-wrap items-center gap-x-1 text-sm text-[var(--color-secondary-text)]">
            <span>
              {call.destination_number
                ? e164ToDisplayPhone(call.destination_number)
                : "Number unavailable"}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatCallDuration(getCallDuration(call))}</span>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </header>

      <section aria-labelledby="recording-heading" className="space-y-3">
        <h2
          id="recording-heading"
          className="flex items-center gap-2 text-xl font-semibold leading-7 text-[var(--color-primary)]"
        >
          <Mic aria-hidden="true" size={20} />
          Recording
        </h2>
        {call.recording_sid ? (
          <audio
            aria-label="Call recording"
            controls
            preload="metadata"
            className="block h-14 w-full max-w-full"
            src={`/api/calls/${encodeURIComponent(call.id)}/recording`}
          >
            Your browser does not support audio playback.
          </audio>
        ) : (
          <p className="text-base text-[var(--color-secondary-text)]">
            No recording is available for this call.
          </p>
        )}
      </section>

      <section
        aria-labelledby="transcript-heading"
        className="space-y-4 border-t border-[var(--color-border)] pt-6"
      >
        <h2
          id="transcript-heading"
          className="flex items-center gap-2 text-xl font-semibold leading-7 text-[var(--color-primary)]"
        >
          <FileText aria-hidden="true" size={20} />
          Transcript
        </h2>
        <Transcript call={call} />
      </section>

      <CallDelete callId={call.id} />
    </div>
  );
}
