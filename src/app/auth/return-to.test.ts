import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
  })),
}));

import { persistOAuthReturnTo } from "./return-to";

describe("persistOAuthReturnTo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores only a safe internal return path in a short-lived HttpOnly cookie", async () => {
    await persistOAuthReturnTo(
      "/calls/97d0a5cd-8742-4059-a821-e57568050bb7",
    );

    expect(cookieSet).toHaveBeenCalledWith(
      "bp_return_to",
      "/calls/97d0a5cd-8742-4059-a821-e57568050bb7",
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/auth/callback",
        maxAge: 600,
        secure: false,
      },
    );
  });

  it("rejects an external return target instead of storing it", async () => {
    await persistOAuthReturnTo("https://evil.com");

    expect(cookieSet).toHaveBeenCalledWith("bp_return_to", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/auth/callback",
      maxAge: 0,
      secure: false,
    });
  });

  it("clears any previous return path when none is provided", async () => {
    await persistOAuthReturnTo(undefined);

    expect(cookieSet).toHaveBeenCalledWith("bp_return_to", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/auth/callback",
      maxAge: 0,
      secure: false,
    });
  });
});
