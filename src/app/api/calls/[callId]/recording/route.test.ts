import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.eq.mockReturnValue(query);

  return {
    authGetUser: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => query),
    })),
    query,
  };
});

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

import { GET } from "./route";

const context = {
  params: Promise.resolve({ callId: "call-1" }),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.eq.mockReturnValue(mocks.query);
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  process.env.TWILIO_AUTH_TOKEN = "twilio-secret";
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Unexpected media request."),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
});

describe("GET /api/calls/[callId]/recording", () => {
  it("rejects unauthenticated access", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not reveal another user's recording", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(404);
    expect(mocks.query.eq).toHaveBeenCalledWith("id", "call-1");
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("streams MP3 audio for the owning user", async () => {
    mocks.authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mocks.query.maybeSingle.mockResolvedValue({
      data: { recording_sid: "REtest" },
      error: null,
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response("mp3 data", {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      }),
    );

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toBe("mp3 data");
  });
});
