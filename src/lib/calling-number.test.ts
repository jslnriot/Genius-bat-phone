import { describe, expect, it, vi } from "vitest";
import { getCallingNumber, isMainAppPath } from "./calling-number";

describe("isMainAppPath", () => {
  it("matches Contacts and Calls routes", () => {
    expect(isMainAppPath("/contacts")).toBe(true);
    expect(isMainAppPath("/calls")).toBe(true);
    expect(isMainAppPath("/calls/call-1")).toBe(true);
  });

  it("does not match onboarding or account", () => {
    expect(isMainAppPath("/onboarding")).toBe(false);
    expect(isMainAppPath("/account")).toBe(false);
  });
});

describe("getCallingNumber", () => {
  it("returns the stored calling number", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { phone_number: "+14165550100" },
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle })),
        })),
      })),
    };

    await expect(
      getCallingNumber(supabase as never, "user-1"),
    ).resolves.toBe("+14165550100");
    expect(supabase.from).toHaveBeenCalledWith("profiles");
  });

  it("returns null when the profile has no calling number", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { phone_number: null } }),
          })),
        })),
      })),
    };

    await expect(
      getCallingNumber(supabase as never, "user-1"),
    ).resolves.toBeNull();
  });
});
