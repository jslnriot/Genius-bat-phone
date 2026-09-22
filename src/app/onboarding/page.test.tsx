import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  maybeSingle: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  AuthButton: vi.fn(),
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

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mocks.redirect(path),
}));

vi.mock("@/components/auth/onboarding-form", () => ({
  OnboardingForm: () => <button>Save and continue</button>,
}));

vi.mock("@/components/auth/auth-button", () => ({
  AuthButton: (props: { mode: "sign-in" | "sign-out" }) =>
    mocks.AuthButton(props),
}));

import OnboardingPage from "./page";

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "ada@example.com" } },
    });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });
    mocks.AuthButton.mockImplementation(
      (props: { mode: "sign-in" | "sign-out" }) => (
        <button>
          {props.mode === "sign-out" ? "Sign out" : "Continue with Google"}
        </button>
      ),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("explains why the calling number is needed", async () => {
    render(await OnboardingPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Set up your calling number",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bat Phone uses your phone number to recognize you when you call.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Calling number")).toBeInTheDocument();
    expect(
      screen.getByText("You can change this later from Account."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save and continue" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Set up your account"),
    ).not.toBeInTheDocument();
  });

  it("shows the signed-in email and a Sign out action without main navigation", async () => {
    render(await OnboardingPage());

    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(mocks.AuthButton).toHaveBeenCalledWith({ mode: "sign-out" });
    expect(
      screen.queryByRole("navigation", { name: "Primary navigation" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Contacts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Calls" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Account" })).not.toBeInTheDocument();
  });

  it("redirects unauthenticated visitors to account", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    await expect(OnboardingPage()).rejects.toThrow("redirect:/account");
  });
});
