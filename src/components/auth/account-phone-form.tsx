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

const CALLING_NUMBER_HINT = "Use the number you’ll call Bat Phone from.";

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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  function openForm() {
    setPhoneError(undefined);
    setFormError(null);
    setSaveStatus("idle");
    setIsEditing(true);
  }

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
    setSaveStatus("saved");
    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="calling-number-heading"
            className="text-xl font-semibold leading-7 text-primary"
          >
            Calling number
          </h2>
          <p className="break-words text-base leading-6 text-primary">
            {savedPhoneNumber
              ? e164ToDisplayPhone(savedPhoneNumber)
              : "Not set"}
          </p>
          <p className="text-sm leading-5 text-secondary-text">
            Calls to Bat Phone must come from this number.
          </p>
          {saveStatus === "saved" ? (
            <p role="status" className="text-sm leading-5 text-success">
              Calling number updated.
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 shrink-0"
          onClick={openForm}
        >
          {savedPhoneNumber ? "Edit" : "Add"}
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
      <h2 id="calling-number-heading" className="sr-only">
        Calling number
      </h2>
      <Input
        label="Calling number"
        type="tel"
        inputMode="numeric"
        name="phone_number"
        autoComplete="tel"
        placeholder="(555) 000-0000"
        hint={CALLING_NUMBER_HINT}
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
        <p role="alert" className="text-sm leading-5 text-error">
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
