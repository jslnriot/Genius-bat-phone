import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CallHistory } from "./call-history";
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
  transcript: "Caller:\nHello.",
  transcription_status: "completed",
};

describe("CallHistory", () => {
  it("displays useful metadata and links to the owned call detail", () => {
    render(<CallHistory calls={[call]} />);

    expect(screen.getByText("James")).toBeInTheDocument();
    expect(screen.getByText("+12125550199")).toBeInTheDocument();
    expect(screen.getByText(/20 sec/)).toBeInTheDocument();
    expect(screen.getByText("Transcript Ready")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/calls/call-1");
  });

  it("renders a useful empty state", () => {
    render(<CallHistory calls={[]} />);

    expect(screen.getByText("No calls yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Calls you place through Bat Phone/),
    ).toBeInTheDocument();
  });
});
