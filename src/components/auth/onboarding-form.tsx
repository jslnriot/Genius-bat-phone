"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProfilePhone } from "@/app/onboarding/actions";
import {
  displayPhoneToE164,
  formatPhoneNumber,
  validateDisplayPhone,
} from "@/lib/contact-validation";

export function OnboardingForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientError = validateDisplayPhone(phoneNumber);
    const e164Phone = displayPhoneToE164(phoneNumber);

    if (clientError || !e164Phone) {
      setPhoneError(clientError);
      return;
    }

    setIsSaving(true);
    setPhoneError(undefined);
    setFormError(null);

    const result = await saveProfilePhone(e164Phone);

    if (!result.success) {
      setPhoneError(result.fieldErrors?.phoneNumber);
      setFormError(result.fieldErrors ? null : result.message);
      setIsSaving(false);
      return;
    }

    router.replace("/contacts");
    router.refresh();
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <Input
        label="Phone number"
        type="tel"
        inputMode="numeric"
        name="phone_number"
        autoComplete="tel"
        placeholder="(555) 000-0000"
        value={phoneNumber}
        error={phoneError}
        onChange={(event) => {
          const formatted = formatPhoneNumber(event.target.value);
          setPhoneNumber(formatted);
          if (!validateDisplayPhone(formatted)) {
            setPhoneError(undefined);
          }
        }}
        onBlur={() => setPhoneError(validateDisplayPhone(phoneNumber))}
        required
      />
      {formError ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}
