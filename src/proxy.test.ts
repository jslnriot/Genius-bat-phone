import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getClaims: mocks.getClaims,
    },
  })),
}));

import { proxy } from "./proxy";

function request(pathname: string) {
  return new NextRequest(`https://genius-bat-phone.vercel.app${pathname}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy", () => {
  it("preserves a safe return path when redirecting logged-out users", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null } });

    const response = await proxy(request("/calls/call-1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://genius-bat-phone.vercel.app/account?next=%2Fcalls%2Fcall-1",
    );
  });
});
