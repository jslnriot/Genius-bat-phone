import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const lookupQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  lookupQuery.eq.mockReturnValue(lookupQuery);

  const deleteQuery = {
    eq: vi.fn(),
  };
  deleteQuery.eq.mockImplementation(function (this: typeof deleteQuery) {
    return this;
  });

  return {
    authGetUser: vi.fn(),
    deleteQuery,
    deleteTwilioRecording: vi.fn(),
    from: vi.fn(),
    lookupQuery,
    revalidatePath: vi.fn(),
    redirect: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    }),
  };
});

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

vi.mock("@/lib/twilio/recording-media", () => ({
  deleteTwilioRecording: mocks.deleteTwilioRecording,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { deleteCall } from "./actions";

const callId = "97d0a5cd-8742-4059-a821-e57568050bb7";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.lookupQuery.eq.mockReturnValue(mocks.lookupQuery);
  mocks.deleteQuery.eq.mockReturnValue(mocks.deleteQuery);
  mocks.from.mockImplementation((table: string) => {
    if (table === "calls") {
      return {
        select: vi.fn(() => mocks.lookupQuery),
        delete: vi.fn(() => mocks.deleteQuery),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
});

describe("deleteCall", () => {
  it("rejects unauthenticated users", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    const result = await deleteCall(callId);

    expect(result).toEqual({
      success: false,
      message: "Sign in again to delete a call.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects invalid call ids", async () => {
    const result = await deleteCall("not-a-uuid");

    expect(result).toEqual({
      success: false,
      message: "This call could not be deleted.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not delete another user's call", async () => {
    mocks.lookupQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await deleteCall(callId);

    expect(result).toEqual({
      success: false,
      message: "This call could not be deleted.",
    });
    expect(mocks.lookupQuery.eq).toHaveBeenCalledWith("id", callId);
    expect(mocks.lookupQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.deleteTwilioRecording).not.toHaveBeenCalled();
    expect(mocks.deleteQuery.eq).not.toHaveBeenCalled();
  });

  it("deletes Twilio media before removing the call row", async () => {
    mocks.lookupQuery.maybeSingle.mockResolvedValue({
      data: { id: callId, recording_sid: "RE111" },
      error: null,
    });
    mocks.deleteTwilioRecording.mockResolvedValue({ success: true });
    mocks.deleteQuery.eq.mockReturnValueOnce(mocks.deleteQuery);
    mocks.deleteQuery.eq.mockResolvedValueOnce({ error: null });

    await expect(deleteCall(callId)).rejects.toThrow("redirect:/calls");

    expect(mocks.deleteTwilioRecording).toHaveBeenCalledWith("RE111");
    expect(mocks.deleteQuery.eq).toHaveBeenCalledWith("id", callId);
    expect(mocks.deleteQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/calls");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/calls/${callId}`);
    expect(mocks.redirect).toHaveBeenCalledWith("/calls");
  });

  it("deletes calls without recordings without contacting Twilio", async () => {
    mocks.lookupQuery.maybeSingle.mockResolvedValue({
      data: { id: callId, recording_sid: null },
      error: null,
    });
    mocks.deleteQuery.eq.mockReturnValueOnce(mocks.deleteQuery);
    mocks.deleteQuery.eq.mockResolvedValueOnce({ error: null });

    await expect(deleteCall(callId)).rejects.toThrow("redirect:/calls");

    expect(mocks.deleteTwilioRecording).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/calls");
  });

  it("keeps the call when Twilio deletion fails", async () => {
    mocks.lookupQuery.maybeSingle.mockResolvedValue({
      data: { id: callId, recording_sid: "RE111" },
      error: null,
    });
    mocks.deleteTwilioRecording.mockResolvedValue({
      success: false,
      status: 500,
    });

    const result = await deleteCall(callId);

    expect(result).toEqual({
      success: false,
      message: "This call could not be deleted. Please try again.",
    });
    expect(mocks.deleteQuery.eq).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns an error when the database delete fails", async () => {
    mocks.lookupQuery.maybeSingle.mockResolvedValue({
      data: { id: callId, recording_sid: null },
      error: null,
    });
    mocks.deleteQuery.eq.mockReturnValueOnce(mocks.deleteQuery);
    mocks.deleteQuery.eq.mockResolvedValueOnce({
      error: { message: "delete failed" },
    });

    const result = await deleteCall(callId);

    expect(result).toEqual({
      success: false,
      message: "This call could not be deleted. Please try again.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
