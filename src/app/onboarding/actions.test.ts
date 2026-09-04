import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  single: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: vi.fn(() => ({
      upsert: mocks.upsert,
    })),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { saveProfilePhone } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "demo@example.com" } },
  });
  mocks.upsert.mockReturnValue({
    select: vi.fn(() => ({
      single: mocks.single,
    })),
  });
  mocks.single.mockResolvedValue({ data: { id: "user-1" }, error: null });
});

describe("saveProfilePhone", () => {
  it("upserts the profile phone number for the signed-in user", async () => {
    const result = await saveProfilePhone("+17164067468");

    expect(result).toEqual({ success: true, data: undefined });
    expect(mocks.upsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        email: "demo@example.com",
        phone_number: "+17164067468",
      },
      { onConflict: "id" },
    );
  });

  it("creates a missing profile row after auth survives a database reset", async () => {
    const result = await saveProfilePhone("+17164067468");

    expect(result.success).toBe(true);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1" }),
      { onConflict: "id" },
    );
  });
});
