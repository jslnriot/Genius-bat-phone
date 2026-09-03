import { redirect } from "next/navigation";
import {
  ContactManager,
  type Contact,
} from "@/components/contacts/contact-manager";
import { createClient } from "@/utils/supabase/server";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, phone_number, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[34px] text-[var(--color-primary)]">
          Contacts
        </h1>
        <p className="text-sm text-[var(--color-secondary-text)]">
          People you can reach through Bat Phone.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-(--radius-card) border border-border bg-white p-4"
        >
          <p className="font-medium text-primary">
            Contacts are temporarily unavailable.
          </p>
          <p className="mt-1 text-sm text-secondary-text">
            Please try again in a moment.
          </p>
        </div>
      ) : (
        <ContactManager initialContacts={(data ?? []) as Contact[]} />
      )}
    </div>
  );
}
