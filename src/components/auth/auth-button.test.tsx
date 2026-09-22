import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();
const signOut = vi.fn();
const persistOAuthReturnTo = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth,
      signOut,
    },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace,
    refresh,
  })),
}));

vi.mock("@/app/auth/return-to", () => ({
  persistOAuthReturnTo: (...args: unknown[]) => persistOAuthReturnTo(...args),
}));

import { AuthButton } from "./auth-button";

describe("AuthButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInWithOAuth.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
    persistOAuthReturnTo.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the OAuth callback URL allowlist-safe and stores the return path separately", async () => {
    render(
      <AuthButton
        mode="sign-in"
        returnTo="/calls/97d0a5cd-8742-4059-a821-e57568050bb7"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(persistOAuthReturnTo).toHaveBeenCalledWith(
      "/calls/97d0a5cd-8742-4059-a821-e57568050bb7",
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });

  it("starts Google OAuth without a return path by default", async () => {
    render(<AuthButton mode="sign-in" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(persistOAuthReturnTo).toHaveBeenCalledWith(undefined);
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

  it("signs out with existing auth behavior and returns to account", async () => {
    render(<AuthButton mode="sign-out" />);

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/account");
    expect(refresh).toHaveBeenCalled();
  });
});
