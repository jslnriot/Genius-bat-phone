import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createContact,
  deleteContact,
  updateContact,
} from "@/app/contacts/actions";
import { ContactManager, type Contact } from "./contact-manager";

vi.mock("@/app/contacts/actions", () => ({
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
}));

const existingContact: Contact = {
  id: "3f6cf18d-536d-42a8-93c6-f12597b8834c",
  name: "Ada Lovelace",
  phone_number: "+12125550199",
  created_at: "2026-09-01T12:00:00.000Z",
};

describe("ContactManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("validates and adds a contact with a canonical phone number", async () => {
    const user = userEvent.setup();
    const newContact: Contact = {
      ...existingContact,
      id: "cf954446-4844-4852-a883-f5f124ca0218",
    };
    vi.mocked(createContact).mockResolvedValue({
      success: true,
      data: newContact,
    });

    render(<ContactManager initialContacts={[]} />);

    await user.click(screen.getByRole("button", { name: "Add contact" }));
    await user.type(screen.getByLabelText("Name"), "Ada123");
    await user.type(screen.getByLabelText("Phone number"), "21255");
    await user.click(screen.getByRole("button", { name: "Add contact" }));

    expect(
      screen.getByText(
        "Use letters, spaces, apostrophes, periods, or hyphens only.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a complete 10-digit phone number."),
    ).toBeInTheDocument();
    expect(createContact).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.clear(screen.getByLabelText("Phone number"));
    await user.type(screen.getByLabelText("Phone number"), "2125550199");
    await user.click(screen.getByRole("button", { name: "Add contact" }));

    expect(createContact).toHaveBeenCalledWith(
      "Ada Lovelace",
      "+12125550199",
    );
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
  });

  it("loads a saved contact for editing and saves the changes", async () => {
    const user = userEvent.setup();
    const updatedContact: Contact = {
      ...existingContact,
      name: "Grace Hopper",
      phone_number: "+14155550100",
    };
    vi.mocked(updateContact).mockResolvedValue({
      success: true,
      data: updatedContact,
    });

    render(<ContactManager initialContacts={[existingContact]} />);

    await user.click(
      screen.getByRole("button", { name: /Ada Lovelace/ }),
    );

    expect(screen.getByLabelText("Phone number")).toHaveValue(
      "(212) 555-0199",
    );

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.clear(screen.getByLabelText("Phone number"));
    await user.type(screen.getByLabelText("Phone number"), "4155550100");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateContact).toHaveBeenCalledWith(
      existingContact.id,
      "Grace Hopper",
      "+14155550100",
    );
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("(415) 555-0100")).toBeInTheDocument();
  });

  it("deletes an existing contact", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteContact).mockResolvedValue({
      success: true,
      data: undefined,
    });

    render(<ContactManager initialContacts={[existingContact]} />);

    await user.click(
      screen.getByRole("button", { name: /Ada Lovelace/ }),
    );
    await user.click(screen.getByRole("button", { name: "Delete contact" }));

    expect(deleteContact).toHaveBeenCalledWith(existingContact.id);
    expect(await screen.findByText("No contacts yet")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });
});
