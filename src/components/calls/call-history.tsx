import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatCallDuration,
  formatCallListTime,
  getCallDuration,
  getCallStatus,
  type CallRecord,
  type CallStatus,
} from "@/lib/calls";
import { e164ToDisplayPhone } from "@/lib/contact-validation";
import { cn } from "@/lib/utils";

function isMeaningfulStatus(label: CallStatus["label"]) {
  return label !== "Completed";
}

export function CallHistory({ calls }: { calls: CallRecord[] }) {
  if (calls.length === 0) {
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold leading-6 text-primary">
            No calls yet
          </h2>
          <p className="text-sm leading-5 text-secondary-text">
            Calls you make through Bat Phone will appear here.
          </p>
        </div>
        <Link
          href="/contacts"
          className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
        >
          View contacts
        </Link>
      </Card>
    );
  }

  return (
    <ul className="overflow-hidden rounded-(--radius-card) border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      {calls.map((call) => {
        const status = getCallStatus(call);
        const duration = formatCallDuration(getCallDuration(call));
        const startedAt = formatCallListTime(call.start_time);

        return (
          <li key={call.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/calls/${encodeURIComponent(call.id)}`}
              className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted-background/80 focus-visible:bg-muted-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-6 text-primary">
                  {call.contact_name_snapshot ?? "Unknown contact"}
                </p>
                <p className="truncate text-sm leading-5 text-secondary-text">
                  {call.destination_number
                    ? e164ToDisplayPhone(call.destination_number)
                    : "Number unavailable"}
                </p>
                <p className="mt-1 text-xs leading-4 text-secondary-text">
                  <span>{startedAt}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{duration}</span>
                </p>
                {isMeaningfulStatus(status.label) ? (
                  <Badge
                    className="mt-2 whitespace-nowrap"
                    variant={status.variant}
                  >
                    {status.label}
                  </Badge>
                ) : null}
              </div>
              <ChevronRight
                aria-hidden="true"
                size={20}
                className="shrink-0 text-secondary-text"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
