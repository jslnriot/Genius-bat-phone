import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { AccountPhoneForm } from "@/components/auth/account-phone-form";
import { AuthButton } from "@/components/auth/auth-button";
import { createClient } from "@/utils/supabase/server";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback: "We couldn’t sign you in. Please try again.",
  missing_code: "The sign-in link was incomplete. Please try again.",
  no_user: "We couldn’t verify your account. Please try again.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const error = (await searchParams).error;
    const errorMessage =
      typeof error === "string" ? AUTH_ERROR_MESSAGES[error] : undefined;

    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-[34px] text-[var(--color-primary)]">
            Account
          </h1>
          <p className="text-sm text-[var(--color-secondary-text)]">
            Sign in to access Bat Phone.
          </p>
        </header>

        {errorMessage ? (
          <div
            role="alert"
            className="flex gap-3 rounded-(--radius-card) border border-error/20 bg-white p-4"
          >
            <AlertCircle
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-error"
            />
            <p className="text-sm leading-5 text-primary">{errorMessage}</p>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use your company Google account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthButton mode="sign-in" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[34px] text-[var(--color-primary)]">
          Account
        </h1>
        <p className="text-sm text-[var(--color-secondary-text)]">
          View your account and calling number.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your signed-in account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-primary)]">
              Email
            </p>
            <p className="break-all text-base text-[var(--color-secondary-text)]">
              {user.email}
            </p>
          </div>
          <AccountPhoneForm initialPhoneNumber={profile?.phone_number ?? null} />
        </CardContent>
      </Card>

      <AuthButton mode="sign-out" />
    </div>
  );
}
