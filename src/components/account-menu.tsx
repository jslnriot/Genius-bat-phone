"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { AccountActivitySummary } from "@/components/account-activity-summary";
import { signOutToAccount } from "@/components/auth/sign-out";

export type AccountMenuProps = {
  email: string;
  initials: string;
  displayName: string | null;
  callingNumber: string;
  contactCount: number;
  callCount: number;
};

export function AccountMenu({
  email,
  initials,
  displayName,
  callingNumber,
  contactCount,
  callCount,
}: AccountMenuProps) {
  const router = useRouter();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    const error = await signOutToAccount(router);
    if (error) {
      setSignOutError(error);
      setIsSigningOut(false);
      return;
    }

    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Open account menu for ${email}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action/10 text-xs font-semibold leading-4 text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
        onClick={() => {
          setSignOutError(null);
          setOpen((isOpen) => !isOpen);
        }}
      >
        <span aria-hidden="true">{initials}</span>
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={menuId}
          role="dialog"
          aria-label="Account menu"
          className="absolute top-full right-0 z-50 mt-2 w-80 max-w-full rounded-(--radius-card) border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <div className="flex flex-col gap-4 p-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              {displayName ? (
                <p className="truncate text-base font-semibold leading-6 text-primary">
                  {displayName}
                </p>
              ) : null}
              <p className="break-all text-sm leading-5 text-secondary-text">
                {email}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium leading-4 text-secondary-text">
                Calling number
              </p>
              <p className="text-base leading-6 text-primary">{callingNumber}</p>
            </div>
            <AccountActivitySummary
              contactCount={contactCount}
              callCount={callCount}
              variant="menu"
              onNavigate={() => setOpen(false)}
            />
            <Link
              href="/account"
              className="flex min-h-11 items-center gap-3 rounded-(--radius-button) px-2 -mx-2 text-sm font-medium text-primary transition-colors hover:bg-muted-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
              onClick={() => setOpen(false)}
            >
              <Settings aria-hidden="true" size={20} className="text-action" />
              Account settings
            </Link>
          </div>
          <div className="border-t border-border p-2">
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-3 rounded-(--radius-button) px-2 text-sm font-medium text-secondary-text transition-colors hover:bg-muted-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:opacity-50"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut aria-hidden="true" size={20} />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
            {signOutError ? (
              <p role="alert" className="px-2 pt-2 text-sm leading-5 text-error">
                {signOutError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
