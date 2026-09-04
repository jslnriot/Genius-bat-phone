import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const callsQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  callsQuery.eq.mockReturnValue(callsQuery);

  const profilesQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  profilesQuery.eq.mockReturnValue(profilesQuery);

  return {
    authGetUser: vi.fn(),
    callsQuery,
    from: vi.fn((table: string) => {
      if (table === "calls") {
        return {
          select: vi.fn(() => mocks.callsQuery),
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn(() => mocks.profilesQuery),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    notFound: vi.fn(() => {
      throw new Error("not-found");
    }),
    profilesQuery,
  };
});

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

import CallDetailPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.callsQuery.eq.mockReturnValue(mocks.callsQuery);
  mocks.profilesQuery.eq.mockReturnValue(mocks.profilesQuery);
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
  mocks.profilesQuery.maybeSingle.mockResolvedValue({
    data: { phone_number: "+13105550123" },
    error: null,
  });
});

describe("CallDetailPage", () => {
  it("redirects logged-out users to sign in with a safe return path", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    await expect(
      CallDetailPage({
        params: Promise.resolve({ id: "call-1" }),
      }),
    ).rejects.toThrow("redirect:/account?next=%2Fcalls%2Fcall-1");
  });

  it("renders a call returned through the authenticated owner query", async () => {
    mocks.callsQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "call-1",
        contact_name_snapshot: "James",
        destination_number: "+12125550199",
        start_time: "2026-09-02T20:40:00.000Z",
        duration: 20,
        recording_sid: null,
        recording_duration: null,
        status: "completed",
        transcript: "Caller:\nHello.",
        transcription_status: "completed",
      },
      error: null,
    });

    render(
      await CallDetailPage({
        params: Promise.resolve({ id: "call-1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Call with James" }),
    ).toBeInTheDocument();
    expect(mocks.callsQuery.eq).toHaveBeenCalledWith("id", "call-1");
    expect(mocks.callsQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(screen.getByText(/From:/)).toBeInTheDocument();
    expect(screen.getByText("(310) 555-0123")).toBeInTheDocument();
  });

  it("renders a call while transcription is still in progress", async () => {
    mocks.callsQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "call-1",
        contact_name_snapshot: "James",
        destination_number: "+12125550199",
        start_time: "2026-09-02T20:40:00.000Z",
        duration: 20,
        recording_sid: "RE111",
        recording_duration: 18,
        status: "completed",
        transcript: null,
        transcription_status: "pending",
      },
      error: null,
    });

    render(
      await CallDetailPage({
        params: Promise.resolve({ id: "call-1" }),
      }),
    );

    expect(screen.getByText("Transcribing")).toBeInTheDocument();
    expect(
      screen.getByText("Transcription in progress"),
    ).toBeInTheDocument();
  });

  it("returns not found when RLS hides another user's call", async () => {
    mocks.callsQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      CallDetailPage({
        params: Promise.resolve({ id: "other-user-call" }),
      }),
    ).rejects.toThrow("not-found");

    expect(mocks.notFound).toHaveBeenCalled();
    expect(mocks.callsQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
