import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  maybeSingle: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: mocks.maybeSingle,
      })),
    })),
  })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getClaims: mocks.getClaims,
    },
    from: mocks.from,
  })),
}));

import { proxy } from "./proxy";

function request(pathname: string) {
  return new NextRequest(`https://genius-bat-phone.vercel.app${pathname}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
  mocks.maybeSingle.mockResolvedValue({ data: { phone_number: "+14165550100" } });
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

describe("proxy", () => {
  it("sends signed-out /contacts visitors to account", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null } });

    const response = await proxy(request("/contacts"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/account?next=%2Fcontacts",
    );
  });

  it("sends signed-out /calls visitors to account", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null } });

    const response = await proxy(request("/calls"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/account?next=%2Fcalls",
    );
  });

  it("preserves a safe return path when redirecting logged-out users", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null } });

    const response = await proxy(request("/calls/call-1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/account?next=%2Fcalls%2Fcall-1",
    );
  });

  it("sends signed-in users without a calling number from /contacts to onboarding", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });

    const response = await proxy(request("/contacts"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/onboarding",
    );
  });

  it("sends signed-in users without a calling number from /calls to onboarding", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });

    const response = await proxy(request("/calls"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/onboarding",
    );
  });

  it("sends signed-in users without a calling number from call detail to onboarding", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });

    const response = await proxy(request("/calls/call-1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/onboarding",
    );
  });

  it("lets configured users reach Contacts and Calls", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });

    const contacts = await proxy(request("/contacts"));
    const calls = await proxy(request("/calls"));
    const callDetail = await proxy(request("/calls/call-1"));

    expect(contacts.status).toBe(200);
    expect(calls.status).toBe(200);
    expect(callDetail.status).toBe(200);
  });

  it("does not block Account for incomplete signed-in users", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });

    const response = await proxy(request("/account"));

    expect(response.status).toBe(200);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
