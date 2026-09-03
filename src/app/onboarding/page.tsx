import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { createClient } from "@/utils/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .single();

  if (profile?.phone_number) {
    redirect("/contacts");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[34px] text-[var(--color-primary)]">
          Set up your account
        </h1>
        <p className="text-sm text-[var(--color-secondary-text)]">
          Add the phone number you’ll use with Bat Phone.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Calling number</CardTitle>
          <CardDescription>
            You can update this later from your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
