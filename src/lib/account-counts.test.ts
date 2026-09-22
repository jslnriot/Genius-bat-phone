import { describe, expect, it, vi } from "vitest";

import { getAccountCounts } from "./account-counts";

describe("getAccountCounts", () => {
  it("returns contact and call counts in parallel", async () => {
    const contactsSelect = vi.fn().mockResolvedValue({ count: 2, error: null });
    const callsEq = vi.fn().mockResolvedValue({ count: 5, error: null });
    const callsSelect = vi.fn().mockReturnValue({ eq: callsEq });
    const from = vi.fn((table: string) => {
      if (table === "contacts") {
        return { select: contactsSelect };
      }
      if (table === "calls") {
        return { select: callsSelect };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await getAccountCounts({ from } as never, "user-1");

    expect(result).toEqual({ contactCount: 2, callCount: 5 });
    expect(contactsSelect).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(callsSelect).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(callsEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns zero when a count query fails", async () => {
    const from = vi.fn((table: string) => {
      if (table === "contacts") {
        return {
          select: vi.fn().mockResolvedValue({
            count: null,
            error: { message: "fail" },
          }),
        };
      }
      if (table === "calls") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await getAccountCounts({ from } as never, "user-1");

    expect(result).toEqual({ contactCount: 0, callCount: 3 });
  });
});
