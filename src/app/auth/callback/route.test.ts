import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  profileMaybeSingle: vi.fn(),
  contactsLimit: vi.fn(),
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
  mocks.profileMaybeSingle.mockResolvedValue({
    data: { phone_number: "+14165550100" },
  });
  mocks.contactsLimit.mockResolvedValue({ data: [], error: null });
  mocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mocks.profileMaybeSingle,
          }),
        }),
      };
    }
    if (table === "contacts") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: mocks.contactsLimit,
          }),
        }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
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

  it("returns to a safe path stored in the return cookie", async () => {
    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
        {
          headers: {
            cookie: "bp_return_to=%2Fcalls%2Fcall-1",
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/calls/call-1",
    );
  });

  it("rejects a malicious return cookie", async () => {
    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
        {
          headers: {
            cookie: "bp_return_to=https%3A%2F%2Fevil.com",
          },
        },
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/contacts",
    );
  });

  it("clears the return cookie after the callback completes", async () => {
    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
        {
          headers: {
            cookie: "bp_return_to=%2Fcalls%2Fcall-1",
          },
        },
      ),
    );

    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toMatch(/bp_return_to=;/);
    expect(setCookie).toMatch(/Max-Age=0/);
    expect(setCookie).toMatch(/Path=\/auth\/callback/);
  });

  it("sends a configured user without contacts to contacts when no return path exists", async () => {
    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/contacts",
    );
  });

  it("sends a configured user with contacts to calls when no return path exists", async () => {
    mocks.contactsLimit.mockResolvedValue({
      data: [{ id: "contact-1" }],
      error: null,
    });

    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/calls",
    );
  });

  it("falls back to onboarding when no phone number is configured", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { phone_number: null } });

    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/onboarding",
    );
  });

  it("sends an incomplete profile to onboarding even when a return path exists", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { phone_number: null } });

    const response = await GET(
      new Request(
        "https://genius-bat-phone.vercel.app/auth/callback?code=abc&next=%2Fcalls%2Fcall-1",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/onboarding",
    );
  });
});
