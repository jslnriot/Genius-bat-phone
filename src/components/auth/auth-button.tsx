"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type AuthButtonProps =
  | { mode: "sign-in"; returnTo?: string | null }
  | { mode: "sign-out" };

async function startGoogleOAuth(returnTo?: string | null) {
  const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
  if (returnTo) {
    callbackUrl.searchParams.set("next", returnTo);
  }

  return createClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });
}

export function AuthSignUpLink() {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);

    const { error } = await startGoogleOAuth("/onboarding");

    if (error) {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      className="text-action text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:opacity-50"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Redirecting…" : "Sign up"}
    </button>
  );
}

export function AuthButton(props: AuthButtonProps) {
  const { mode } = props;
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = mode === "sign-in" ? props.returnTo : undefined;

  async function handleClick() {
    setIsPending(true);
    setError(null);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error: signInError } = await startGoogleOAuth(returnTo);

      if (signInError) {
        setError("Google sign-in could not be started. Please try again.");
        setIsPending(false);
      }
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("Sign out failed. Please try again.");
      setIsPending(false);
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={mode === "sign-in" ? "default" : "secondary"}
        className="w-full gap-3"
        onClick={handleClick}
        disabled={isPending}
      >
        {mode === "sign-in" ? (
          <Mail aria-hidden="true" size={20} />
        ) : (
          <LogOut aria-hidden="true" size={20} />
        )}
        {isPending
          ? mode === "sign-in"
            ? "Redirecting…"
            : "Signing out…"
          : mode === "sign-in"
            ? "Sign in with Google"
            : "Sign out"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
