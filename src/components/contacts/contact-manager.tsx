"use client";

import { FormEvent, useState } from "react";
import { ChevronRight, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createContact,
  deleteContact,
  updateContact,
} from "@/app/contacts/actions";
import {
  CONTACT_NAME_MAX_LENGTH,
  displayPhoneToE164,
  e164ToDisplayPhone,
  formatPhoneNumber,
  type ContactRecord,
  type FieldErrors,
  validateContactName,
  validateDisplayPhone,
} from "@/lib/contact-validation";

export type Contact = ContactRecord;

type ContactManagerProps = {
  initialContacts: Contact[];
};

export function ContactManager({ initialContacts }: ContactManagerProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function openAddForm() {
    setEditingContact(null);
    setName("");
    setPhoneNumber("");
    setFieldErrors({});
    setFormError(null);
    setIsAdding(true);
  }

  function openEditForm(contact: Contact) {
    setEditingContact(contact);
    setName(contact.name);
    setPhoneNumber(e164ToDisplayPhone(contact.phone_number));
    setFieldErrors({});
    setFormError(null);
    setIsAdding(false);
  }

  function closeForm() {
    setEditingContact(null);
    setIsAdding(false);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const phoneError = validateDisplayPhone(phoneNumber);
    const clientErrors: FieldErrors = {};
    const nameError = validateContactName(name);

    if (nameError) {
      clientErrors.name = nameError;
    }
    if (phoneError) {
      clientErrors.phoneNumber = phoneError;
    }

    const e164Phone = displayPhoneToE164(phoneNumber);
    if (Object.keys(clientErrors).length > 0 || !e164Phone) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);

    const result = editingContact
      ? await updateContact(editingContact.id, trimmedName, e164Phone)
      : await createContact(trimmedName, e164Phone);

    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.fieldErrors ? null : result.message);
      setIsSaving(false);
      return;
    }

    if (editingContact) {
      setContacts((current) =>
        current.map((contact) =>
          contact.id === result.data.id ? result.data : contact,
        ),
      );
    } else {
      setContacts((current) => [result.data, ...current]);
    }

    setIsSaving(false);
    closeForm();
  }

  async function handleDelete() {
    if (!editingContact) return;

    setIsSaving(true);
    setFormError(null);

    const result = await deleteContact(editingContact.id);

    if (!result.success) {
      setFormError(result.message);
      setIsSaving(false);
      return;
    }

    setContacts((current) =>
      current.filter((contact) => contact.id !== editingContact.id),
    );
    setIsSaving(false);
    closeForm();
  }

  const formIsOpen = isAdding || editingContact !== null;

  return (
    <div className="flex flex-col gap-6">
      {!formIsOpen ? (
        <Button type="button" className="w-full gap-3" onClick={openAddForm}>
          <Plus size={20} />
          Add Contact
        </Button>
      ) : (
        <Card>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <h2 className="text-primary text-xl font-semibold leading-7">
              {editingContact ? "Edit contact" : "Add contact"}
            </h2>
            <Input
              label="Name"
              name="name"
              autoComplete="name"
              value={name}
              maxLength={CONTACT_NAME_MAX_LENGTH}
              error={fieldErrors.name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (fieldErrors.name) {
                  setFieldErrors((current) => ({
                    ...current,
                    name: validateContactName(nextName),
                  }));
                }
              }}
              onBlur={() => {
                setFieldErrors((current) => ({
                  ...current,
                  name: validateContactName(name),
                }));
              }}
              required
            />
            <Input
              label="Phone number"
              type="tel"
              inputMode="numeric"
              name="phone_number"
              autoComplete="tel"
              placeholder="(555) 000-0000"
              value={phoneNumber}
              error={fieldErrors.phoneNumber}
              onChange={(event) => {
                const formatted = formatPhoneNumber(event.target.value);
                setPhoneNumber(formatted);
                if (!validateDisplayPhone(formatted)) {
                  setFieldErrors((current) => ({
                    ...current,
                    phoneNumber: undefined,
                  }));
                }
              }}
              onBlur={() => {
                setFieldErrors((current) => ({
                  ...current,
                  phoneNumber: validateDisplayPhone(phoneNumber),
                }));
              }}
              required
            />
            {formError ? (
              <p role="alert" className="text-error text-sm">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving
                  ? "Saving…"
                  : editingContact
                    ? "Save changes"
                    : "Add contact"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancel
              </Button>
              {editingContact ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={isSaving}
                >
                  Delete Contact
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      )}

      {!formIsOpen && contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="bg-muted-background flex h-16 w-16 items-center justify-center rounded-full">
            <Users
              size={32}
              className="text-secondary-text"
            />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-primary text-base font-medium">
              No contacts yet
            </p>
            <p className="text-secondary-text text-sm">
              Add contacts to start making calls.
            </p>
          </div>
        </div>
      ) : null}

      {!formIsOpen && contacts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="flex min-h-14 w-full items-center gap-3 rounded-(--radius-card) border border-border bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
              onClick={() => openEditForm(contact)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-primary truncate text-base font-semibold leading-6">
                  {contact.name}
                </p>
                <p className="text-secondary-text text-sm leading-5">
                  {e164ToDisplayPhone(contact.phone_number)}
                </p>
              </div>
              <ChevronRight
                size={20}
                className="text-secondary-text shrink-0"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
