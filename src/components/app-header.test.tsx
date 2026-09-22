import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { AppHeader } from "./app-header";

const account = {
  email: "james@example.com",
  initials: "JB",
  displayName: "James Buczkowski",
  callingNumber: "(716) 406-7468",
  contactCount: 2,
  callCount: 5,
};

describe("AppHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the Bat Phone wordmark with a phone icon", () => {
    render(<AppHeader />);

    const header = screen.getByRole("banner", { name: "Bat Phone" });
    expect(header).toBeInTheDocument();
    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(header.querySelector("svg")).not.toBeNull();
    expect(
      screen.queryByRole("link", { name: "Bat Phone home" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open account menu/ }),
    ).not.toBeInTheDocument();
  });

  it("links configured users home to Contacts", () => {
    render(<AppHeader homeHref="/contacts" />);

    expect(screen.getByRole("link", { name: "Bat Phone home" })).toHaveAttribute(
      "href",
      "/contacts",
    );
    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open account menu/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a compact identity control that opens the account menu", async () => {
    const user = userEvent.setup();
    render(<AppHeader homeHref="/contacts" account={account} />);

    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(
      screen.getByRole("banner", { name: "Bat Phone" }).querySelector("svg"),
    ).not.toBeNull();
    const trigger = screen.getByRole("button", {
      name: "Open account menu for james@example.com",
    });
    expect(trigger).toHaveTextContent("JB");
    expect(screen.queryByText("james@example.com")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByText("james@example.com")).toBeInTheDocument();
    expect(screen.getByText("(716) 406-7468")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Account settings" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("link", { name: /Contacts/ })).toHaveAttribute(
      "href",
      "/contacts",
    );
    expect(screen.getByRole("link", { name: /Calls/ })).toHaveAttribute(
      "href",
      "/calls",
    );
  });
});
