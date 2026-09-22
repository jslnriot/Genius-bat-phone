"use client";

import { createClient } from "@/utils/supabase/client";

export const SIGN_OUT_ERROR = "Sign out failed. Please try again.";

export async function signOutToAccount(router: {
  replace: (href: string) => void;
  refresh: () => void;
}) {
  const { error } = await createClient().auth.signOut();

  if (error) {
    return SIGN_OUT_ERROR;
  }

  router.replace("/account");
  router.refresh();
  return null;
}
