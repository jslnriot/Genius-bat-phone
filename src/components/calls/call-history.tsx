import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatCallDuration,
  formatCallListTime,
  getCallDuration,
  getCallStatus,
  type CallRecord,
} from "@/lib/calls";
import { e164ToDisplayPhone } from "@/lib/contact-validation";

export function CallHistory({ calls }: { calls: CallRecord[] }) {
  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-muted-background)]">
          <Phone
            aria-hidden="true"
            size={32}
            className="text-[var(--color-secondary-text)]"
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-medium text-[var(--color-primary)]">
            No calls yet
          </p>
          <p className="max-w-72 text-sm text-[var(--color-secondary-text)]">
            Calls you place through Bat Phone will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white">
      {calls.map((call) => {
        const status = getCallStatus(call);
        const duration = formatCallDuration(getCallDuration(call));

        return (
          <li
            key={call.id}
            className="border-b border-[var(--color-border)] last:border-b-0"
          >
            <Link
              href={`/calls/${encodeURIComponent(call.id)}`}
              className="flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 truncate text-base font-semibold leading-6 text-[var(--color-primary)]">
                    {call.contact_name_snapshot ?? "Unknown contact"}
                  </p>
                  <Badge className="mt-0.5 shrink-0 whitespace-nowrap" variant={status.variant}>
                    {status.label}
                  </Badge>
                </div>
                <p className="truncate text-sm leading-5 text-[var(--color-secondary-text)]">
                  {call.destination_number
                    ? e164ToDisplayPhone(call.destination_number)
                    : "Number unavailable"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-1 text-sm leading-5 text-[var(--color-secondary-text)]">
                  <span>{formatCallListTime(call.start_time)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{duration}</span>
                </div>
              </div>
              <ChevronRight
                aria-hidden="true"
                size={20}
                className="shrink-0 text-[var(--color-secondary-text)]"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
