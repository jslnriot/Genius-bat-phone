import { describe, expect, it } from "vitest";
import {
  formatCallDuration,
  getCallStatus,
  getUnsuccessfulDialSummary,
  parseTranscript,
} from "./calls";

describe("call presentation", () => {
  it.each([
    [
      { status: "completed", transcript: null, transcription_status: "pending" },
      "Transcribing",
    ],
    [
      {
        status: "completed",
        transcript: null,
        transcription_status: "processing",
      },
      "Transcribing",
    ],
    [
      {
        status: "completed",
        transcript: "Caller:\nHello.",
        transcription_status: "completed",
      },
      "Transcript Ready",
    ],
    [
      { status: "completed", transcript: null, transcription_status: "failed" },
      "Transcript Unavailable",
    ],
    [
      { status: "failed", transcript: null, transcription_status: null },
      "Failed",
    ],
    [{ status: "busy", transcript: null, transcription_status: null }, "Busy"],
    [
      { status: "canceled", transcript: null, transcription_status: null },
      "Canceled",
    ],
    [
      { status: "no-answer", transcript: null, transcription_status: null },
      "No answer",
    ],
    [
      { status: "in_progress", transcript: null, transcription_status: null },
      "Calling",
    ],
  ])("maps existing call state to %s", (call, expected) => {
    expect(getCallStatus(call).label).toBe(expected);
  });

  it.each([
    ["no-answer", "The contact did not answer. You can call Bat Phone again anytime."],
    ["busy", "The contact was busy. You can call Bat Phone again anytime."],
    ["canceled", "The call was canceled before it connected."],
    ["failed", "The call could not be completed. You can call Bat Phone again anytime."],
    ["completed", null],
    [null, null],
  ])("maps dial status %s to unsuccessful summary", (status, expected) => {
    expect(getUnsuccessfulDialSummary(status)).toBe(expected);
  });

  it("prefers terminal dial outcomes over transcription state", () => {
    expect(
      getCallStatus({
        status: "busy",
        transcript: null,
        transcription_status: "pending",
      }).label,
    ).toBe("Busy");
  });

  it("keeps completed transcribed calls in the transcript-ready state", () => {
    expect(
      getCallStatus({
        status: "completed",
        transcript: "Caller:\nHello.",
        transcription_status: "completed",
      }).label,
    ).toBe("Transcript Ready");
  });

  it("uses concise readable durations", () => {
    expect(formatCallDuration(20)).toBe("20 sec");
    expect(formatCallDuration(75)).toBe("1 min 15 sec");
    expect(formatCallDuration(null)).toBe("Duration unavailable");
  });

  it("preserves transcript text while separating speaker labels", () => {
    expect(parseTranscript("Caller:\nHello.\n\nJames:\nHello back.")).toEqual([
      { speaker: "Caller", text: "Hello." },
      { speaker: "James", text: "Hello back." },
    ]);
  });
});
