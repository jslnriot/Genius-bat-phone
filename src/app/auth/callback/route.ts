import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/account?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/account?error=auth_callback`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/account?error=no_user`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .single();

  return NextResponse.redirect(
    `${origin}${profile?.phone_number ? "/contacts" : "/onboarding"}`,
  );
}
