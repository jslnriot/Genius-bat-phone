import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signOut },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

import { AccountMenu } from "./account-menu";

const account = {
  email: "james@example.com",
  initials: "JB",
  displayName: "James Buczkowski",
  callingNumber: "(716) 406-7468",
};

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps identity details closed until the initials control is opened", () => {
    render(<AccountMenu {...account} />);

    const trigger = screen.getByRole("button", {
      name: "Open account menu for james@example.com",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("JB");
    expect(screen.queryByText("james@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("(716) 406-7468")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Account settings" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Contacts/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Calls/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/contacts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/calls/i)).not.toBeInTheDocument();
  });

  it("shows identity, calling number, and account actions in the menu", async () => {
    const user = userEvent.setup();
    render(<AccountMenu {...account} />);

    await user.click(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("James Buczkowski")).toBeInTheDocument();
    expect(screen.getByText("james@example.com")).toBeInTheDocument();
    expect(screen.getByText("Calling number")).toBeInTheDocument();
    expect(screen.getByText("(716) 406-7468")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Account settings" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Contacts/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Calls/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/analytics/i)).not.toBeInTheDocument();
  });

  it("shows email only when a display name is unavailable", async () => {
    const user = userEvent.setup();
    render(
      <AccountMenu
        {...account}
        displayName={null}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    );

    expect(screen.getByText("james@example.com")).toBeInTheDocument();
    expect(screen.queryByText("James Buczkowski")).not.toBeInTheDocument();
  });

  it("toggles closed when the initials control is pressed again", async () => {
    const user = userEvent.setup();
    render(<AccountMenu {...account} />);
    const trigger = screen.getByRole("button", {
      name: "Open account menu for james@example.com",
    });

    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeInTheDocument();
    await user.click(trigger);
    expect(
      screen.queryByRole("dialog", { name: "Account menu" }),
    ).not.toBeInTheDocument();
  });

  it("closes on Escape and outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AccountMenu {...account} />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    );
    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Account menu" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(
      screen.queryByRole("dialog", { name: "Account menu" }),
    ).not.toBeInTheDocument();
  });

  it("closes after choosing Account settings", async () => {
    const user = userEvent.setup();
    render(<AccountMenu {...account} />);

    await user.click(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    );
    await user.click(screen.getByRole("link", { name: "Account settings" }));

    expect(
      screen.queryByRole("dialog", { name: "Account menu" }),
    ).not.toBeInTheDocument();
  });

  it("signs out with the existing auth behavior", async () => {
    const user = userEvent.setup();
    render(<AccountMenu {...account} />);

    await user.click(
      screen.getByRole("button", {
        name: "Open account menu for james@example.com",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/account");
    expect(refresh).toHaveBeenCalled();
  });
});
