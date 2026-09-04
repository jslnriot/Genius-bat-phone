import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteCall: vi.fn(),
}));

vi.mock("@/app/calls/actions", () => ({
  deleteCall: mocks.deleteCall,
}));

import { CallDelete } from "./call-delete";

const callId = "97d0a5cd-8742-4059-a821-e57568050bb7";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("CallDelete", () => {
  it("requires confirmation before deleting", async () => {
    const user = userEvent.setup();
    render(<CallDelete callId={callId} />);

    expect(
      screen.getByRole("button", { name: "Delete call" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Delete this call?" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete call" }));

    expect(
      screen.getByRole("heading", { name: "Delete this call?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This will remove the call and its transcript from your Bat Phone history. This action cannot be undone.",
      ),
    ).toBeInTheDocument();
    expect(mocks.deleteCall).not.toHaveBeenCalled();
  });

  it("cancels without deleting", async () => {
    const user = userEvent.setup();
    render(<CallDelete callId={callId} />);

    await user.click(screen.getByRole("button", { name: "Delete call" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("heading", { name: "Delete this call?" }),
    ).not.toBeInTheDocument();
    expect(mocks.deleteCall).not.toHaveBeenCalled();
  });

  it("shows an error when deletion fails", async () => {
    mocks.deleteCall.mockResolvedValue({
      success: false,
      message: "This call could not be deleted. Please try again.",
    });
    const user = userEvent.setup();
    render(<CallDelete callId={callId} />);

    await user.click(screen.getByRole("button", { name: "Delete call" }));
    await user.click(screen.getByRole("button", { name: "Delete call" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This call could not be deleted. Please try again.",
    );
    expect(mocks.deleteCall).toHaveBeenCalledWith(callId);
  });

  it("calls the delete action after confirmation", async () => {
    mocks.deleteCall.mockResolvedValue({
      success: false,
      message: "This call could not be deleted. Please try again.",
    });
    const user = userEvent.setup();
    render(<CallDelete callId={callId} />);

    await user.click(screen.getByRole("button", { name: "Delete call" }));
    await user.click(screen.getByRole("button", { name: "Delete call" }));

    expect(mocks.deleteCall).toHaveBeenCalledTimes(1);
    expect(mocks.deleteCall).toHaveBeenCalledWith(callId);
  });
});
