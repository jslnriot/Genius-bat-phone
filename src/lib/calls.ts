export type CallRecord = {
  id: string;
  contact_name_snapshot: string | null;
  destination_number: string | null;
  status: string | null;
  start_time: string | null;
  duration: number | null;
  recording_sid: string | null;
  recording_duration: number | null;
  transcript: string | null;
  transcription_status: string | null;
};

export type CallStatus = {
  label:
    | "Calling"
    | "Completed"
    | "Transcribing"
    | "Transcript Ready"
    | "Transcript Unavailable"
    | "Busy"
    | "Canceled"
    | "No answer"
    | "Failed";
  variant: "default" | "success" | "warning" | "error" | "action";
};

const ACTIVE_CALL_STATUSES = new Set([
  "in_progress",
  "initiated",
  "queued",
  "ringing",
]);
export function getCallStatus(
  call: Pick<CallRecord, "status" | "transcript" | "transcription_status">,
): CallStatus {
  if (call.status === "busy") {
    return { label: "Busy", variant: "warning" };
  }

  if (call.status === "canceled") {
    return { label: "Canceled", variant: "default" };
  }

  if (call.status === "no-answer") {
    return { label: "No answer", variant: "warning" };
  }

  if (call.status === "failed") {
    return { label: "Failed", variant: "error" };
  }

  if (ACTIVE_CALL_STATUSES.has(call.status ?? "")) {
    return { label: "Calling", variant: "action" };
  }

  if (
    call.transcription_status === "pending" ||
    call.transcription_status === "processing"
  ) {
    return { label: "Transcribing", variant: "warning" };
  }

  if (call.transcription_status === "completed" && call.transcript?.trim()) {
    return { label: "Transcript Ready", variant: "success" };
  }

  if (call.transcription_status === "failed") {
    return { label: "Transcript Unavailable", variant: "default" };
  }

  return { label: "Completed", variant: "default" };
}

export function getCallDuration(
  call: Pick<CallRecord, "duration" | "recording_duration">,
) {
  return call.recording_duration ?? call.duration;
}

export function formatCallDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return "Duration unavailable";
  }

  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;

  if (minutes === 0) return `${remainder} sec`;
  return remainder === 0
    ? `${minutes} min`
    : `${minutes} min ${remainder} sec`;
}

export function formatCallListTime(value: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatCallDetailTime(value: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export type TranscriptSection = {
  speaker: string | null;
  text: string;
};

export function parseTranscript(transcript: string): TranscriptSection[] {
  return transcript
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^([^\n:]+):\s*\n([\s\S]*)$/);
      return match
        ? { speaker: match[1].trim(), text: match[2].trim() }
        : { speaker: null, text: block };
    });
}
