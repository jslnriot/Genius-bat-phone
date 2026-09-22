import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, FileText, Phone, Users, type LucideIcon } from "lucide-react";
import { AccountPhoneForm } from "@/components/auth/account-phone-form";
import { AuthButton } from "@/components/auth/auth-button";
import { resolveSafeReturnPath } from "@/lib/safe-return-path";
import { createClient } from "@/utils/supabase/server";

const HOW_IT_WORKS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Users,
    title: "Add your contacts",
    description: "Save the people you want to reach.",
  },
  {
    icon: Phone,
    title: "Call Bat Phone",
    description: "Call from your registered number and say a contact’s name.",
  },
  {
    icon: FileText,
    title: "Review your call",
    description: "Recording and transcript are saved automatically.",
  },
];

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback: "We couldn’t sign you in. Please try again.",
  missing_code: "The sign-in link was incomplete. Please try again.",
  no_user: "We couldn’t verify your account. Please try again.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const resolvedSearchParams = await searchParams;
    const error = resolvedSearchParams.error;
    const returnTo = resolveSafeReturnPath(
      typeof resolvedSearchParams.next === "string"
        ? resolvedSearchParams.next
        : undefined,
    );
    const errorMessage =
      typeof error === "string" ? AUTH_ERROR_MESSAGES[error] : undefined;

    return (
      <div className="flex flex-col gap-8">
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

        <section className="flex flex-col pt-2">
          <h1 className="text-[28px] leading-[34px] font-bold text-primary">
            Make a call. We’ll handle the rest.
          </h1>
          <p className="mt-4 text-base leading-6 text-secondary-text">
            Call one number, say who you want to reach, and Bat Phone connects
            the call. Recording, transcription, and call history happen
            automatically.
          </p>
          <div className="mt-6">
            <AuthButton mode="sign-in" returnTo={returnTo} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] leading-7 font-semibold text-primary">
            How it works
          </h2>
          <ol className="m-0 list-none overflow-hidden rounded-(--radius-card) border border-border bg-white p-0">
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon;

              return (
                <li
                  key={step.title}
                  className="flex min-h-14 items-start gap-3 border-b border-border px-4 py-4 last:border-b-0"
                >
                  <div
                    aria-hidden="true"
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-button) bg-muted-background"
                  >
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base leading-6 font-semibold text-primary">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-secondary-text">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="border-t border-border pt-6 text-center text-xs leading-4 text-secondary-text">
          Voice calling · Recording · Transcription
        </p>
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
