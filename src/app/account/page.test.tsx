import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: authGetUser },
  })),
}));

vi.mock("@/components/auth/auth-button", () => ({
  AuthButton: () => <button>Sign in with Google</button>,
  AuthSignUpLink: () => <button>Sign up</button>,
}));

vi.mock("@/components/auth/account-phone-form", () => ({
  AccountPhoneForm: () => null,
}));

import AccountPage from "./page";

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUser.mockResolvedValue({ data: { user: null } });
  });

  afterEach(() => {
    cleanup();
  });

  it("explains an OAuth callback failure", async () => {
    render(
      await AccountPage({
        searchParams: Promise.resolve({ error: "auth_callback" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t sign you in. Please try again.",
    );
  });

  it("ignores unknown error codes", async () => {
    render(
      await AccountPage({
        searchParams: Promise.resolve({ error: "unexpected" }),
      }),
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("offers a sign-up link for new users", async () => {
    render(await AccountPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("Don't have an account?", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  });
});
