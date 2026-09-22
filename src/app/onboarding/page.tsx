import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthButton } from "@/components/auth/auth-button";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { resolveDefaultAppPath } from "@/lib/app-routing";
import { getCallingNumber } from "@/lib/calling-number";
import { createClient } from "@/utils/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const callingNumber = await getCallingNumber(supabase, user.id);
  if (callingNumber) {
    redirect(await resolveDefaultAppPath(supabase, user.id, callingNumber));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[34px] font-bold text-primary">
          Set up your calling number
        </h1>
        <p className="text-sm leading-5 text-secondary-text">
          Bat Phone uses your phone number to recognize you when you call.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Calling number</CardTitle>
          <CardDescription>
            You can change this later from Account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>

      <section className="border-t border-border pt-8">
        <p className="text-sm font-medium leading-5 text-primary">
          Signed in as
        </p>
        <p className="mt-1 break-all text-base leading-6 text-secondary-text">
          {user.email}
        </p>
        <div className="mt-4">
          <AuthButton mode="sign-out" />
        </div>
      </section>
    </div>
  );
}
