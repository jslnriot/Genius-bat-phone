"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type AuthButtonProps =
  | { mode: "sign-in" }
  | { mode: "sign-out" };

export function AuthButton({ mode }: AuthButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

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
        {mode === "sign-in" ? <Mail size={20} /> : <LogOut size={20} />}
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
