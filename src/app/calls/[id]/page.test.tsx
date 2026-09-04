import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.eq.mockReturnValue(query);

  return {
    authGetUser: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => query),
    })),
    notFound: vi.fn(() => {
      throw new Error("not-found");
    }),
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
  notFound: mocks.notFound,
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

import CallDetailPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
});

describe("CallDetailPage", () => {
  it("renders a call returned through the authenticated owner query", async () => {
    mocks.query.maybeSingle.mockResolvedValue({
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
    expect(mocks.query.eq).toHaveBeenCalledWith("id", "call-1");
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("renders a call while transcription is still in progress", async () => {
    mocks.query.maybeSingle.mockResolvedValue({
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
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      CallDetailPage({
        params: Promise.resolve({ id: "other-user-call" }),
      }),
    ).rejects.toThrow("not-found");

    expect(mocks.notFound).toHaveBeenCalled();
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
