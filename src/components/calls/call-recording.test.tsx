import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallRecording } from "./call-recording";

afterEach(() => {
  cleanup();
});

describe("CallRecording", () => {
  it("renders the native player and a secondary download action", () => {
    const { container } = render(<CallRecording callId="call-1" />);

    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute("src", "/api/calls/call-1/recording");
    expect(audio).toHaveAttribute("controls");
    expect(
      screen.getByRole("link", { name: "Download recording" }),
    ).toHaveAttribute("href", "/api/calls/call-1/recording?download=1");
  });

  it("shows a customer-facing message when playback fails", () => {
    const { container } = render(<CallRecording callId="call-1" />);
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();
    fireEvent.error(audio!);

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(
      "The recording could not be played. You can still download it.",
    );
    expect(container.querySelector("audio")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download recording" }),
    ).toBeInTheDocument();
  });
});
