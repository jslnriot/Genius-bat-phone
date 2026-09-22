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
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mocks.maybeSingle,
        })),
      })),
    })),
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
      screen.queryByRole("navigation", { name: "Primary navigation" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Contacts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Calls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Account" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
  });
});
