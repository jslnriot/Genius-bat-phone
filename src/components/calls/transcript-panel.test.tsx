import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { TranscriptPanel } from "./transcript-panel";

describe("TranscriptPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows a copy button when transcript text is available", async () => {
    const user = userEvent.setup();
    render(
      <TranscriptPanel copyText="Caller:\nHello.">
        <p>Hello.</p>
      </TranscriptPanel>,
    );

    await user.click(screen.getByRole("button", { name: "Copy transcript" }));

    expect(
      await screen.findByRole("button", { name: "Transcript copied" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { name: "Copied!" })).toBeInTheDocument();
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
