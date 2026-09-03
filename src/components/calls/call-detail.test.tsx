import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CallDetail } from "./call-detail";
import type { CallRecord } from "@/lib/calls";

const call: CallRecord = {
  id: "call-1",
  contact_name_snapshot: "James",
  destination_number: "+12125550199",
  start_time: "2026-09-02T20:40:00.000Z",
  duration: 25,
  recording_sid: "RE111",
  recording_duration: 20,
  status: "completed",
  transcript: "Caller:\nHello.\n\nJames:\nHello back.",
  transcription_status: "completed",
};

describe("CallDetail", () => {
  it("renders the transcript and protected recording player", () => {
    const { container } = render(<CallDetail call={call} />);

    expect(
      screen.getByRole("heading", { name: "Call with James" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Caller")).toBeInTheDocument();
    expect(screen.getByText("Hello.")).toBeInTheDocument();
    expect(screen.getByText("James")).toBeInTheDocument();
    expect(screen.getByText("Hello back.")).toBeInTheDocument();

    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute(
      "src",
      "/api/calls/call-1/recording",
    );
    expect(audio).toHaveAttribute("controls");
  });

  it("keeps recording available when transcription fails", () => {
    const { container } = render(
      <CallDetail
        call={{
          ...call,
          transcript: null,
          transcription_status: "failed",
        }}
      />,
    );

    expect(screen.getByText("Transcript unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("The recording is still available above."),
    ).toBeInTheDocument();
    expect(container.querySelector("audio")).toBeInTheDocument();
  });
});
