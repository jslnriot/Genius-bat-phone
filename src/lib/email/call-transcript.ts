import "server-only";

import { Resend } from "resend";
import { logTwilioEvent } from "@/lib/twilio/logging";
import type {
  Phase4Call,
  Phase4Repository,
} from "@/lib/twilio/phase4-repository";

type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export interface CallEmailSender {
  send(message: EmailMessage, idempotencyKey: string): Promise<void>;
}

export class ResendCallEmailSender implements CallEmailSender {
  async send(message: EmailMessage, idempotencyKey: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

    const { error } = await new Resend(apiKey).emails.send(
      {
        from: message.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
      },
      { idempotencyKey },
    );

    if (error) throw new Error(`Resend rejected the email: ${error.name}.`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatStartTime(value: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return "Unavailable";
  }

  const wholeSeconds = Math.round(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return minutes > 0
    ? `${minutes}m ${remainder}s`
    : `${remainder}s`;
}

export function buildCallEmail(
  call: Phase4Call,
  recipient: string,
  transcript: string | null,
) {
  const contactName = call.contact_name_snapshot ?? "Unknown contact";
  const recordingUrl = call.recording_url ?? "";
  const transcriptSection = transcript
    ? `<h2>Transcript</h2><div style="white-space: pre-wrap">${escapeHtml(transcript)}</div>`
    : `<h2>Transcript</h2><p>Transcript unavailable.</p><p>The call recording is still available here:</p>`;

  return {
    subject: `Bat Phone — Call Transcript: ${contactName}`,
    html: [
      "<h1>Call Transcript</h1>",
      `<p><strong>Caller:</strong> ${escapeHtml(recipient)}<br>`,
      `<strong>Destination:</strong> ${escapeHtml(contactName)}<br>`,
      `<strong>Phone Number:</strong> ${escapeHtml(call.destination_number ?? "Unavailable")}<br>`,
      `<strong>Call Start Time:</strong> ${escapeHtml(formatStartTime(call.start_time))}<br>`,
      `<strong>Call Duration:</strong> ${escapeHtml(formatDuration(call.recording_duration ?? call.duration))}</p>`,
      transcriptSection,
      "<h2>Recording</h2>",
      recordingUrl
        ? `<p><a href="${escapeHtml(recordingUrl)}">Listen to the call recording</a></p>`
        : "<p>Recording unavailable.</p>",
    ].join(""),
  };
}

export async function sendCallEmail(
  call: Phase4Call,
  transcript: string | null,
  repository: Phase4Repository,
  sender: CallEmailSender,
) {
  if (call.email_status !== null) return;
  if (!(await repository.claimEmail(call.id))) return;

  const recipient = await repository.resolveUserEmail(call.user_id);
  if (!recipient) {
    await repository.markEmailSkipped(call.id);
    logTwilioEvent("error", "twilio.email_recipient_missing", {
      callId: call.id,
      recordingSid: call.recording_sid,
    });
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL;
  const email = buildCallEmail(call, recipient, transcript);
  const idempotencyKey = `bat-phone-call-${call.id}`;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await repository.setEmailAttempt(call.id, attempt);

    try {
      if (!from) throw new Error("RESEND_FROM_EMAIL is not configured.");
      await sender.send({ ...email, from, to: recipient }, idempotencyKey);
      await repository.markEmailSent(call.id);
      logTwilioEvent("info", "twilio.email_sent", {
        attempt,
        callId: call.id,
        recordingSid: call.recording_sid,
      });
      return;
    } catch (error) {
      logTwilioEvent(
        "error",
        "twilio.email_attempt_failed",
        {
          attempt,
          callId: call.id,
          recordingSid: call.recording_sid,
        },
        error,
      );
    }
  }

  await repository.markEmailFailed(call.id);
}
