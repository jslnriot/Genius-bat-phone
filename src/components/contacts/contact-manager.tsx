"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
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

type ContactManagerProps = {
  initialContacts: ContactRecord[];
};

const destructiveOutlineClassName =
  "min-h-11 w-full border border-error/30 bg-white hover:bg-error/10";

export function ContactManager({ initialContacts }: ContactManagerProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactRecord | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  function openAddForm() {
    setEditingContact(null);
    setName("");
    setPhoneNumber("");
    setFieldErrors({});
    setFormError(null);
    setIsAdding(true);
  }

  function openEditForm(contact: ContactRecord) {
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

  function openDeleteConfirmation(contact: ContactRecord) {
    setDeleteError(null);
    setDeletingContact(contact);
  }

  function closeDeleteConfirmation() {
    if (isDeletingContact) return;
    setDeleteError(null);
    setDeletingContact(null);
  }

  async function removeContact(contact: ContactRecord) {
    const result = await deleteContact(contact.id);

    if (!result.success) {
      return result;
    }

    setContacts((current) =>
      current.filter((item) => item.id !== contact.id),
    );
    return result;
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

    const result = await removeContact(editingContact);

    if (!result.success) {
      setFormError(result.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    closeForm();
  }

  async function handleConfirmDelete() {
    if (!deletingContact) return;

    setIsDeletingContact(true);
    setDeleteError(null);

    const result = await removeContact(deletingContact);

    if (!result.success) {
      setDeleteError(result.message);
      setIsDeletingContact(false);
      return;
    }

    setIsDeletingContact(false);
    setDeletingContact(null);
  }

  const formIsOpen = isAdding || editingContact !== null;

  return (
    <div className="flex flex-col gap-6">
      {!formIsOpen ? (
        <Tooltip label="Add a new contact" className="w-full">
          <Button type="button" className="w-full gap-3" onClick={openAddForm}>
            <Plus aria-hidden="true" size={20} />
            Add contact
          </Button>
        </Tooltip>
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
              <Tooltip
                label={
                  editingContact ? "Save contact changes" : "Add this contact"
                }
                className="w-full"
              >
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving
                    ? "Saving…"
                    : editingContact
                      ? "Save changes"
                      : "Add contact"}
                </Button>
              </Tooltip>
              <Tooltip
                label={
                  editingContact
                    ? "Cancel editing"
                    : "Cancel and return to contacts"
                }
                className="w-full"
              >
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </Tooltip>
              {editingContact ? (
                <Tooltip label="Delete this contact" className="w-full">
                  <Button
                    type="button"
                    variant="destructive"
                    className={`mt-2 ${destructiveOutlineClassName}`}
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    Delete contact
                  </Button>
                </Tooltip>
              ) : null}
            </div>
          </form>
        </Card>
      )}

      {!formIsOpen && contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="bg-muted-background flex h-16 w-16 items-center justify-center rounded-full">
            <Users
              aria-hidden="true"
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
          {contacts.map((contact) =>
            deletingContact?.id === contact.id ? (
              <Card key={contact.id} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-primary">
                    Delete {contact.name}?
                  </h2>
                  <p className="text-sm text-secondary-text">
                    This contact will be removed from Bat Phone. Historical calls
                    will remain in your call history.
                  </p>
                </div>
                {deleteError ? (
                  <p role="alert" className="text-error text-sm">
                    {deleteError}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2">
                  <Tooltip label="Cancel deletion" className="w-full">
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 w-full"
                      disabled={isDeletingContact}
                      onClick={closeDeleteConfirmation}
                    >
                      Cancel
                    </Button>
                  </Tooltip>
                  <Tooltip
                    label="Permanently delete this contact"
                    className="w-full"
                  >
                    <Button
                      type="button"
                      variant="destructive"
                      className={destructiveOutlineClassName}
                      disabled={isDeletingContact}
                      onClick={handleConfirmDelete}
                    >
                      {isDeletingContact ? "Deleting…" : "Delete contact"}
                    </Button>
                  </Tooltip>
                </div>
              </Card>
            ) : (
              <div
                key={contact.id}
                className="flex min-h-14 w-full items-center rounded-(--radius-card) border border-border bg-white pr-1 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
              >
                <button
                  type="button"
                  className="flex min-h-14 min-w-0 flex-1 items-center px-4 py-3 text-left transition-colors hover:bg-muted-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action"
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
                </button>
                <Tooltip label={`Edit ${contact.name}`}>
                  <button
                    type="button"
                    aria-label={`Edit ${contact.name}`}
                    className="text-secondary-text hover:text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
                    onClick={() => openEditForm(contact)}
                  >
                    <Pencil aria-hidden="true" size={20} />
                  </button>
                </Tooltip>
                <Tooltip label={`Delete ${contact.name}`}>
                  <button
                    type="button"
                    aria-label={`Delete ${contact.name}`}
                    className="text-secondary-text hover:text-error mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
                    onClick={() => openDeleteConfirmation(contact)}
                  >
                    <Trash2 aria-hidden="true" size={20} />
                  </button>
                </Tooltip>
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
