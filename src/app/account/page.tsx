import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthButton } from "@/components/auth/auth-button";
import { createClient } from "@/utils/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
          Manage your account settings.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your signed-in account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-primary)]">
              Email
            </p>
            <p className="text-base text-[var(--color-secondary-text)]">
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-primary)]">
              Phone number
            </p>
            <p className="text-base text-[var(--color-secondary-text)]">
              {profile?.phone_number ?? "Not set"}
            </p>
          </div>
        </CardContent>
      </Card>

      <AuthButton mode="sign-out" />
    </div>
  );
}
