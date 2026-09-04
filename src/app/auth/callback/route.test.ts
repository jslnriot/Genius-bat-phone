import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
    },
    from: mocks.from,
  })),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mocks.from.mockReturnValue({
    select: mocks.select.mockReturnValue({
      eq: mocks.eq.mockReturnValue({
        single: mocks.single,
      }),
    }),
  });
  mocks.single.mockResolvedValue({ data: { phone_number: "+14165550100" } });
});

describe("GET /auth/callback", () => {
  it("returns to a safe requested call path after OAuth", async () => {
    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc&next=%2Fcalls%2Fcall-1",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/calls/call-1",
    );
  });

  it("rejects a malicious external return target", async () => {
    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc&next=https%3A%2F%2Fevil.com",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/contacts",
    );
  });

  it("falls back to onboarding when no phone number is configured", async () => {
    mocks.single.mockResolvedValue({ data: { phone_number: null } });

    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/onboarding",
    );
  });
});
