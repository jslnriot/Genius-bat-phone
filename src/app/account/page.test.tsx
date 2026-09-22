import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  AuthButton: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

vi.mock("@/components/auth/auth-button", () => ({
  AuthButton: (props: { mode: "sign-in" | "sign-out"; returnTo?: string | null }) =>
    mocks.AuthButton(props),
}));

vi.mock("@/components/auth/account-phone-form", () => ({
  AccountPhoneForm: () => null,
}));

import AccountPage from "./page";

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });
    mocks.from.mockReturnValue({
      select: mocks.select.mockReturnValue({
        eq: mocks.eq.mockReturnValue({
          single: mocks.single.mockResolvedValue({
            data: { phone_number: "+14165550100" },
          }),
        }),
      }),
    });
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

  it("explains the product and how to get started", async () => {
    render(await AccountPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Make a call. We’ll handle the rest.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Call one number, say who you want to reach/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "How it works" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1. Add your contacts")).toBeInTheDocument();
    expect(screen.getByText("2. Call Bat Phone")).toBeInTheDocument();
    expect(screen.getByText("3. Review your call")).toBeInTheDocument();
    expect(
      screen.getByText("Voice calling · Recording · Transcription"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Don't have an account?", { exact: false }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Use your company Google account", { exact: false }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });

  it("passes a safe return path through to Google sign-in", async () => {
    render(
      await AccountPage({
        searchParams: Promise.resolve({
          next: "/calls/97d0a5cd-8742-4059-a821-e57568050bb7",
        }),
      }),
    );

    expect(mocks.AuthButton).toHaveBeenCalledWith({
      mode: "sign-in",
      returnTo: "/calls/97d0a5cd-8742-4059-a821-e57568050bb7",
    });
  });

  it("keeps the signed-in account screen unchanged", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "ada@example.com" } },
    });

    render(await AccountPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Account" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Make a call. We’ll handle the rest.",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Voice calling · Recording · Transcription"),
    ).not.toBeInTheDocument();
    expect(mocks.AuthButton).toHaveBeenCalledWith({ mode: "sign-out" });
  });
});
