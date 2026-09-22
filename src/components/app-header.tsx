import Link from "next/link";
import { Phone } from "lucide-react";

type AppHeaderProps = {
  homeHref?: string;
  account?: {
    email: string;
    initials: string;
  };
};

export function AppHeader({ homeHref, account }: AppHeaderProps) {
  const brand = (
    <>
      <Phone aria-hidden="true" size={20} className="shrink-0 text-action" />
      <span className="text-base font-semibold leading-6 tracking-tight text-primary">
        Bat Phone
      </span>
    </>
  );

  return (
    <header
      aria-label="Bat Phone"
      className="sticky top-0 z-40 border-b border-border bg-white pt-[env(safe-area-inset-top)]"
    >
      <div className="flex h-14 items-center px-4">
        {homeHref ? (
          <Link
            href={homeHref}
            aria-label="Bat Phone home"
            className="-ml-1 flex min-h-11 items-center gap-3 rounded-(--radius-button) px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
          >
            {brand}
          </Link>
        ) : (
          <div className="flex items-center gap-3">{brand}</div>
        )}
        {account ? (
          <Link
            href="/account"
            aria-label={`Account for ${account.email}`}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action/10 text-xs font-semibold leading-4 text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">{account.initials}</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
