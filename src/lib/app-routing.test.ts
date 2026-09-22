import { describe, expect, it, vi } from "vitest";

import { hasContacts, resolveDefaultAppPath } from "./app-routing";

describe("app routing", () => {
  it("detects when at least one contact exists", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [{ id: "c-1" }], error: null });
    const eq = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(hasContacts({ from } as never, "user-1")).resolves.toBe(true);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("sends configured users with contacts to calls", async () => {
    const from = vi.fn((table: string) => {
      if (table === "contacts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ id: "c-1" }], error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    });

    await expect(
      resolveDefaultAppPath({ from } as never, "user-1", "+14165550100"),
    ).resolves.toBe("/calls");
  });

  it("sends configured users without contacts to contacts", async () => {
    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }));

    await expect(
      resolveDefaultAppPath({ from } as never, "user-1", "+14165550100"),
    ).resolves.toBe("/contacts");
  });

  it("sends users without a calling number to onboarding", async () => {
    await expect(
      resolveDefaultAppPath({ from: vi.fn() } as never, "user-1", null),
    ).resolves.toBe("/onboarding");
  });
});
