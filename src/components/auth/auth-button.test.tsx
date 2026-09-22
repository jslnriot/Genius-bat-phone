import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth,
      signOut: vi.fn(),
    },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

import { AuthButton } from "./auth-button";

describe("AuthButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("includes a safe return path in the OAuth callback URL", async () => {
    render(
      <AuthButton
        mode="sign-in"
        returnTo="/calls/97d0a5cd-8742-4059-a821-e57568050bb7"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Fcalls%2F97d0a5cd-8742-4059-a821-e57568050bb7",
      },
    });
  });

  it("starts Google OAuth without a return path by default", async () => {
    render(<AuthButton mode="sign-in" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });

  it("disables the button while redirecting", async () => {
    let resolveOAuth: (value: { error: null }) => void = () => {};
    signInWithOAuth.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOAuth = resolve;
        }),
    );

    render(<AuthButton mode="sign-in" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(screen.getByRole("button", { name: "Redirecting…" })).toBeDisabled();
    resolveOAuth({ error: null });
  });

  it("announces when Google OAuth cannot start", async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: "fail" } });

    render(<AuthButton mode="sign-in" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Google sign-in could not be started. Please try again.",
    );
  });
});
