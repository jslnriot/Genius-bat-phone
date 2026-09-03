import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    eq: vi.fn(),
    order: vi.fn(),
  };
  query.eq.mockReturnValue(query);

  return {
    authGetUser: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => query),
    })),
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

import CallsPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
  mocks.query.order.mockResolvedValue({ data: [], error: null });
});

describe("CallsPage", () => {
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
});
