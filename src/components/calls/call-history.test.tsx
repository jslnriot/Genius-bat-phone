import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallHistory } from "./call-history";
import { formatCallListTime, type CallRecord } from "@/lib/calls";

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

afterEach(() => {
  cleanup();
});

describe("CallHistory", () => {
  it("displays useful metadata and links to the owned call detail", () => {
    render(<CallHistory calls={[call]} />);

    expect(screen.getByText("James")).toBeInTheDocument();
    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
    expect(screen.getByText(formatCallListTime(call.start_time))).toBeInTheDocument();
    expect(screen.getByText(/20 sec/)).toBeInTheDocument();
    expect(screen.getByText("Transcript Ready")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/calls/call-1");
  });

  it("does not badge ordinary completed calls", () => {
    render(
      <CallHistory
        calls={[
          {
            ...call,
            transcript: null,
            transcription_status: null,
          },
        ]}
      />,
    );

    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/calls/call-1");
  });

  it("renders a useful empty state", () => {
    render(<CallHistory calls={[]} />);

    expect(
      screen.getByRole("heading", { name: "No calls yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Calls you make through Bat Phone will appear here."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View contacts" }),
    ).not.toBeInTheDocument();
  });

  it("shows a transcribing call from the stored snapshot name", () => {
    render(
      <CallHistory
        calls={[
          {
            ...call,
            contact_name_snapshot: "Alice",
            transcript: null,
            transcription_status: "processing",
          },
        ]}
      />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Transcribing")).toBeInTheDocument();
  });

  it("shows failed transcription calls in history with a subdued badge", () => {
    render(
      <CallHistory
        calls={[
          {
            ...call,
            transcript: null,
            transcription_status: "failed",
          },
        ]}
      />,
    );

    expect(screen.getByText("Transcript Unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/calls/call-1");
  });
});
