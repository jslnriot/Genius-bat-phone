import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  maybeSingle: vi.fn(),
  contactsLimit: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mocks.maybeSingle,
            })),
          })),
        };
      }
      if (table === "contacts") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: mocks.contactsLimit,
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mocks.redirect(path),
}));

import Home from "./page";

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.contactsLimit.mockResolvedValue({ data: [{ id: "c-1" }], error: null });
  });

  it("sends signed-out visitors to the account landing page", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    await expect(Home()).rejects.toThrow("redirect:/account");
    expect(mocks.redirect).toHaveBeenCalledWith("/account");
  });

  it("sends configured users with contacts to calls", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mocks.maybeSingle.mockResolvedValue({
      data: { phone_number: "+14165550100" },
    });

    await expect(Home()).rejects.toThrow("redirect:/calls");
  });

  it("sends configured users without contacts to contacts", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mocks.maybeSingle.mockResolvedValue({
      data: { phone_number: "+14165550100" },
    });
    mocks.contactsLimit.mockResolvedValue({ data: [], error: null });

    await expect(Home()).rejects.toThrow("redirect:/contacts");
  });

  it("sends signed-in users without a calling number to onboarding", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mocks.maybeSingle.mockResolvedValue({ data: { phone_number: null } });

    await expect(Home()).rejects.toThrow("redirect:/onboarding");
  });
});
