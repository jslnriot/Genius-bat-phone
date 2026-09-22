import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    eq: vi.fn(),
    order: vi.fn(),
  };
  query.eq.mockReturnValue(query);

  const profilesQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  profilesQuery.eq.mockReturnValue(profilesQuery);

  return {
    authGetUser: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === "calls") {
        return {
          select: vi.fn(() => mocks.query),
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn(() => mocks.profilesQuery),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    profilesQuery,
    query,
  };
});

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/twilio/environment", () => ({
  getTwilioPhoneNumber: () => "+12892782417",
}));

import CallsPage from "./page";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.profilesQuery.eq.mockReturnValue(mocks.profilesQuery);
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
  mocks.profilesQuery.maybeSingle.mockResolvedValue({
    data: { phone_number: "+14165550100" },
  });
  mocks.query.order.mockResolvedValue({ data: [], error: null });
});

describe("CallsPage", () => {
  it("redirects signed-out visitors to account", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    await expect(CallsPage()).rejects.toThrow("redirect:/account");
  });

  it("redirects signed-in users without a calling number to onboarding", async () => {
    mocks.profilesQuery.maybeSingle.mockResolvedValue({
      data: { phone_number: null },
    });

    await expect(CallsPage()).rejects.toThrow("redirect:/onboarding");
  });

  it("queries only the authenticated user's calls newest first", async () => {
    await CallsPage();

    expect(mocks.from).toHaveBeenCalledWith("calls");
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.query.order).toHaveBeenCalledWith("start_time", {
      ascending: false,
      nullsFirst: false,
    });
  });

  it("renders call metadata returned by the owner-scoped query", async () => {
    mocks.query.order.mockResolvedValue({
      data: [
        {
          id: "call-1",
          contact_name_snapshot: "Vish",
          destination_number: "+12125550199",
          start_time: "2026-09-02T20:40:00.000Z",
          duration: 12,
          recording_sid: "RE111",
          recording_duration: 10,
          status: "completed",
          transcript: "Caller:\nHello.",
          transcription_status: "completed",
        },
      ],
      error: null,
    });

    render(await CallsPage());

    expect(screen.getByText("Vish")).toBeInTheDocument();
    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
    expect(screen.getByText(/10 sec/)).toBeInTheDocument();
  });

  it("shows the compact Bat Phone utility and empty history state", async () => {
    render(await CallsPage());

    expect(screen.getByLabelText("Call Bat Phone")).toBeInTheDocument();
    expect(screen.getByText("(289) 278-2417")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Call from your registered phone and say a contact's name.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No calls yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Calls you make through Bat Phone will appear here."),
    ).toBeInTheDocument();
  });

  it("shows a customer-facing error when calls cannot be loaded", async () => {
    mocks.query.order.mockResolvedValue({
      data: null,
      error: { message: "permission denied for table calls" },
    });

    render(await CallsPage());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Calls are temporarily unavailable.",
    );
    expect(
      screen.getByText("Please try again in a moment."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/permission denied/i),
    ).not.toBeInTheDocument();
  });
});
