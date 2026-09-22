import Link from "next/link";
import { Phone } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";

type AppHeaderProps = {
  homeHref?: string;
  account?: {
    email: string;
    initials: string;
    displayName: string | null;
    callingNumber: string;
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
      <div className="relative flex h-14 items-center px-4">
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
        {account ? <AccountMenu {...account} /> : null}
      </div>
    </header>
  );
}
