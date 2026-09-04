import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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

afterEach(() => {
  cleanup();
});

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

    expect(screen.getByText("Transcript Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Transcript unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("The recording is still available above."),
    ).toBeInTheDocument();
    expect(container.querySelector("audio")).toBeInTheDocument();
  });

  it("shows transcript unavailable without recording guidance when no recording exists", () => {
    const { container } = render(
      <CallDetail
        call={{
          ...call,
          recording_sid: null,
          recording_duration: null,
          transcript: null,
          transcription_status: "failed",
        }}
      />,
    );

    expect(screen.getByText("Transcript Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Transcript unavailable")).toBeInTheDocument();
    expect(
      screen.queryByText("The recording is still available above."),
    ).not.toBeInTheDocument();
    expect(container.querySelector("audio")).not.toBeInTheDocument();
  });

  it("shows failed dial outcomes without a recording player", () => {
    const { container } = render(
      <CallDetail
        call={{
          ...call,
          duration: 0,
          recording_sid: null,
          recording_duration: null,
          status: "no-answer",
          transcript: null,
          transcription_status: null,
        }}
      />,
    );

    expect(screen.getByText("No answer")).toBeInTheDocument();
    expect(
      screen.getByText("No recording is available for this call."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No transcript was created for this call."),
    ).toBeInTheDocument();
    expect(container.querySelector("audio")).not.toBeInTheDocument();
  });

  it.each(["pending", "processing"] as const)(
    "shows in-progress transcription with recording when status is %s",
    (transcriptionStatus) => {
      const { container } = render(
        <CallDetail
          call={{
            ...call,
            transcript: null,
            transcription_status: transcriptionStatus,
          }}
        />,
      );

      expect(screen.getByText("Transcribing")).toBeInTheDocument();
      expect(
        screen.getByText("Transcription in progress"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("The transcript will appear here when it’s ready."),
      ).toBeInTheDocument();
      expect(container.querySelector("audio")).toBeInTheDocument();
      expect(screen.queryByText("Hello.")).not.toBeInTheDocument();
    },
  );

  it("keeps the historical snapshot name after a contact rename", () => {
    render(
      <CallDetail
        call={{
          ...call,
          contact_name_snapshot: "Alice",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Call with Alice" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Alicia")).not.toBeInTheDocument();
  });

  it("remains usable from calls-row fields after the contact is deleted", () => {
    const { container } = render(
      <CallDetail
        call={{
          ...call,
          contact_name_snapshot: "Deleted Contact",
          destination_number: "+14155550100",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Call with Deleted Contact" }),
    ).toBeInTheDocument();
    expect(screen.getByText("(415) 555-0100")).toBeInTheDocument();
    expect(screen.getByText("Hello.")).toBeInTheDocument();
    expect(container.querySelector("audio")).toBeInTheDocument();
  });

  it("includes a delete call action below the transcript", () => {
    render(<CallDetail call={call} />);

    expect(
      screen.getByRole("button", { name: "Delete call" }),
    ).toBeInTheDocument();
  });
});
