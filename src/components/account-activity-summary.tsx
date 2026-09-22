import Link from "next/link";
import { ChevronRight, Phone, Users } from "lucide-react";
import {
  callCountDescription,
  contactCountDescription,
  formatCountNoun,
} from "@/lib/account-count-labels";
import { cn } from "@/lib/utils";

type AccountActivitySummaryProps = {
  contactCount: number;
  callCount: number;
  variant: "menu" | "page";
  onNavigate?: () => void;
};

function ActivityRow({
  href,
  icon: Icon,
  title,
  count,
  countLabel,
  description,
  variant,
  onNavigate,
  className,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  count: number;
  countLabel: string;
  description?: string;
  variant: "menu" | "page";
  onNavigate?: () => void;
  className?: string;
}) {
  const isPage = variant === "page";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-(--radius-button) transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2",
        isPage ? "border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]" : "px-2 py-2",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-(--radius-button) bg-action/10",
          isPage ? "h-10 w-10" : "h-9 w-9",
        )}
      >
        <Icon size={isPage ? 20 : 18} className="text-action" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium leading-5 text-primary">{title}</p>
          <p
            className={cn(
              "shrink-0 tabular-nums text-primary",
              isPage ? "text-xl font-semibold leading-7" : "text-base font-semibold leading-6",
            )}
          >
            {count}
          </p>
        </div>
        {isPage ? (
          <p className="mt-1 text-sm leading-5 text-secondary-text">
            {description}
          </p>
        ) : (
          <p className="text-xs leading-4 text-secondary-text">{countLabel}</p>
        )}
      </div>
      {isPage ? (
        <ChevronRight
          aria-hidden="true"
          size={20}
          className="shrink-0 text-secondary-text"
        />
      ) : null}
    </Link>
  );
}

export function AccountActivitySummary({
  contactCount,
  callCount,
  variant,
  onNavigate,
}: AccountActivitySummaryProps) {
  const isPage = variant === "page";

  return (
    <section
      aria-labelledby={isPage ? "account-activity-heading" : undefined}
      className={cn(
        "flex flex-col",
        isPage ? "gap-3" : "gap-1 rounded-(--radius-card) border border-border bg-muted-background/60 p-2",
      )}
    >
      {isPage ? (
        <h2
          id="account-activity-heading"
          className="text-sm font-medium leading-5 text-primary"
        >
          Your Bat Phone activity
        </h2>
      ) : null}
      <div className={cn("flex flex-col", isPage ? "gap-3" : "gap-0.5")}>
        <ActivityRow
          href="/contacts"
          icon={Users}
          title="Contacts"
          count={contactCount}
          countLabel={formatCountNoun(contactCount, "contact", "contacts")}
          description={contactCountDescription(contactCount)}
          variant={variant}
          onNavigate={onNavigate}
        />
        <ActivityRow
          href="/calls"
          icon={Phone}
          title="Calls"
          count={callCount}
          countLabel={formatCountNoun(callCount, "call", "calls")}
          description={callCountDescription(callCount)}
          variant={variant}
          onNavigate={onNavigate}
        />
      </div>
    </section>
  );
}
