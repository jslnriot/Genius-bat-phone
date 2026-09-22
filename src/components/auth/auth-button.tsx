"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { persistOAuthReturnTo } from "@/app/auth/return-to";
import { signOutToAccount } from "@/components/auth/sign-out";
import { createClient } from "@/utils/supabase/client";

type AuthButtonProps =
  | { mode: "sign-in"; returnTo?: string | null }
  | { mode: "sign-out" };

async function startGoogleOAuth(returnTo?: string | null) {
  await persistOAuthReturnTo(returnTo);

  return createClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
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

    if (mode === "sign-in") {
      const { error: signInError } = await startGoogleOAuth(returnTo);

      if (signInError) {
        setError("Google sign-in could not be started. Please try again.");
        setIsPending(false);
      }
      return;
    }

    const signOutError = await signOutToAccount(router);
    if (signOutError) {
      setError(signOutError);
      setIsPending(false);
    }
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
            ? "Continue with Google"
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
