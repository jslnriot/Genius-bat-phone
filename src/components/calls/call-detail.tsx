import Link from "next/link";
import { ArrowLeft, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CallDelete } from "@/components/calls/call-delete";
import { CallRecording } from "@/components/calls/call-recording";
import { TranscriptPanel } from "@/components/calls/transcript-panel";
import {
  formatCallDetailTime,
  formatCallDuration,
  getCallDuration,
  getCallStatus,
  parseTranscript,
  type CallRecord,
} from "@/lib/calls";
import { e164ToDisplayPhone } from "@/lib/contact-validation";

function CallMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs leading-4 text-secondary-text">{label}</dt>
      <dd className="text-base leading-6 text-primary">{value}</dd>
    </div>
  );
}

function Transcript({ call }: { call: CallRecord }) {
  if (
    call.transcription_status === "pending" ||
    call.transcription_status === "processing"
  ) {
    return (
      <div role="status" className="flex flex-col gap-1">
        <p className="text-base font-medium leading-6 text-primary">
          Preparing transcript
        </p>
        <p className="text-sm leading-5 text-secondary-text">
          The transcript is being prepared. Check back in a moment.
        </p>
      </div>
    );
  }

  if (call.transcription_status === "failed") {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium leading-6 text-primary">
          Transcript unavailable
        </p>
        <p className="text-sm leading-5 text-secondary-text">
          {call.recording_sid
            ? "The recording is still available above."
            : "A transcript could not be created for this call."}
        </p>
      </div>
    );
  }

  if (!call.transcript?.trim()) {
    return (
      <p className="text-base leading-6 text-secondary-text">
        No transcript was created for this call.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {parseTranscript(call.transcript).map((section, index) => (
        <div key={`${section.speaker ?? "text"}-${index}`}>
          {section.speaker ? (
            <p className="mb-1 break-words text-sm font-semibold leading-5 text-primary">
              {section.speaker}
            </p>
          ) : null}
          <p className="break-words whitespace-pre-wrap text-base leading-6 text-primary">
            {section.text}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CallDetail({
  call,
  callerPhoneNumber,
}: {
  call: CallRecord;
  callerPhoneNumber?: string | null;
}) {
  const status = getCallStatus(call);
  const duration = getCallDuration(call);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/calls"
          className="-ml-2 flex min-h-11 w-fit items-center gap-3 rounded-[var(--radius-button)] px-2 text-sm font-medium text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" size={20} />
          Return to calls
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="break-words text-[28px] font-bold leading-[34px] text-primary">
            Call with {call.contact_name_snapshot ?? "Unknown contact"}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm leading-5 text-secondary-text">
              {formatCallDetailTime(call.start_time)}
            </p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <dl className="flex flex-col gap-3">
          <CallMetaItem
            label="From"
            value={
              callerPhoneNumber
                ? e164ToDisplayPhone(callerPhoneNumber)
                : "Your calling number is unavailable"
            }
          />
          <CallMetaItem
            label="To"
            value={
              call.destination_number
                ? e164ToDisplayPhone(call.destination_number)
                : "Number unavailable"
            }
          />
          <CallMetaItem
            label="Duration"
            value={formatCallDuration(duration)}
          />
        </dl>
      </header>

      <section aria-labelledby="recording-heading" className="flex flex-col gap-4">
        <h2
          id="recording-heading"
          className="flex items-center gap-3 text-xl font-semibold leading-7 text-primary"
        >
          <Mic aria-hidden="true" size={20} />
          Recording
        </h2>
        {call.recording_sid ? (
          <CallRecording callId={call.id} />
        ) : (
          <p className="text-base leading-6 text-secondary-text">
            No recording is available for this call.
          </p>
        )}
      </section>

      <TranscriptPanel
        copyText={
          call.transcription_status === "completed" ? call.transcript : null
        }
      >
        <Transcript call={call} />
      </TranscriptPanel>

      <CallDelete callId={call.id} />
    </div>
  );
}
