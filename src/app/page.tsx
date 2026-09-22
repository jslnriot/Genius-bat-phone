import { redirect } from "next/navigation";
import { resolveDefaultAppPath } from "@/lib/app-routing";
import { getCallingNumber } from "@/lib/calling-number";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const callingNumber = await getCallingNumber(supabase, user.id);
  redirect(await resolveDefaultAppPath(supabase, user.id, callingNumber));
}
