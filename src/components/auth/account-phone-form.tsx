"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfilePhone } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  displayPhoneToE164,
  e164ToDisplayPhone,
  formatPhoneNumber,
  validateDisplayPhone,
} from "@/lib/contact-validation";

export function AccountPhoneForm({
  initialPhoneNumber,
}: {
  initialPhoneNumber: string | null;
}) {
  const router = useRouter();
  const [savedPhoneNumber, setSavedPhoneNumber] = useState(initialPhoneNumber);
  const [phoneNumber, setPhoneNumber] = useState(
    initialPhoneNumber ? e164ToDisplayPhone(initialPhoneNumber) : "",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  function closeForm() {
    setPhoneNumber(
      savedPhoneNumber ? e164ToDisplayPhone(savedPhoneNumber) : "",
    );
    setPhoneError(undefined);
    setFormError(null);
    setIsEditing(false);
  }

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

    setSavedPhoneNumber(e164Phone);
    setPhoneNumber(e164ToDisplayPhone(e164Phone));
    setIsSaving(false);
    setIsEditing(false);
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Phone number</p>
          <p className="break-words text-base text-secondary-text">
            {savedPhoneNumber
              ? e164ToDisplayPhone(savedPhoneNumber)
              : "Not set"}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 shrink-0"
          onClick={() => setIsEditing(true)}
        >
          {savedPhoneNumber ? "Change" : "Add"}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex scroll-mt-6 flex-col gap-4"
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
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={closeForm}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
