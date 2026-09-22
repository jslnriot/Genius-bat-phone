import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

vi.mock("./globals.css", () => ({}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mocks.maybeSingle,
            })),
          })),
        };
      }
      if (table === "contacts") {
        return {
          select: vi.fn().mockResolvedValue({ count: 2, error: null }),
        };
      }
      if (table === "calls") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          })),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  })),
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides Contacts, Calls, and Account navigation until a calling number is saved", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "ada@example.com" } },
    });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });

    render(
      await RootLayout({
        children: <div>Set up your calling number</div>,
      }),
    );

    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Bat Phone home" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open account menu/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Primary navigation" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Contacts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Calls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Account" })).not.toBeInTheDocument();
    expect(screen.getByRole("main")).not.toHaveClass("overflow-y-auto");
  });

  it("shows the bottom navigation after calling-number setup is complete", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "ada@example.com" } },
    });
    mocks.maybeSingle.mockResolvedValue({
      data: { phone_number: "+14165550100" },
    });

    render(
      await RootLayout({
        children: <div>Contacts</div>,
      }),
    );

    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contacts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Calls" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Account$/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bat Phone home" })).toHaveAttribute(
      "href",
      "/contacts",
    );
    const accountIdentity = screen.getByRole("button", {
      name: "Open account menu for ada@example.com",
    });
    expect(accountIdentity).toHaveTextContent("A");
    expect(accountIdentity).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("(416) 555-0100")).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const main = screen.getByRole("main");
    expect(nav.className).not.toMatch(/\bfixed\b/);
    expect(main).toHaveClass("overflow-y-auto");
    expect(main).toHaveClass("pb-6");
    expect(main.parentElement).toContainElement(nav);
  });

  it("keeps signed-out chrome non-interactive besides the landing content", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    render(
      await RootLayout({
        children: <div>Make a call. We’ll handle the rest.</div>,
      }),
    );

    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Bat Phone home" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open account menu/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Primary navigation" }),
    ).not.toBeInTheDocument();
  });
});
