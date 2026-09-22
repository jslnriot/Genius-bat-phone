import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TranscriptPanel } from "./transcript-panel";

describe("TranscriptPanel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a copy button when transcript text is available", async () => {
    const user = userEvent.setup();
    render(
      <TranscriptPanel copyText="Caller:\nHello.">
        <p>Hello.</p>
      </TranscriptPanel>,
    );

    expect(
      screen.getByRole("button", { name: "Copy transcript" }),
    ).toHaveTextContent("Copy");

    await user.click(screen.getByRole("button", { name: "Copy transcript" }));

    expect(
      await screen.findByRole("button", { name: "Transcript copied" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("shows a quiet error when the transcript cannot be copied", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(
      <TranscriptPanel copyText="Caller:\nHello.">
        <p>Hello.</p>
      </TranscriptPanel>,
    );

    await user.click(screen.getByRole("button", { name: "Copy transcript" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "The transcript could not be copied.",
    );
  });

  it("does not show a copy button when there is nothing to copy", () => {
    render(
      <TranscriptPanel copyText={null}>
        <p>No transcript was created for this call.</p>
      </TranscriptPanel>,
    );

    expect(
      screen.queryByRole("button", { name: "Copy transcript" }),
    ).not.toBeInTheDocument();
  });
});
