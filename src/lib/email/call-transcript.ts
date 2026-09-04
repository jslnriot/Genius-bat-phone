import "server-only";

import { Resend } from "resend";
import { callDetailUrl } from "@/lib/application-url";
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
  const detailUrl = callDetailUrl(call.id);
  const transcriptSection = transcript
    ? `<h2 style="color:#16324F;font-size:20px;line-height:28px;margin:32px 0 12px">Transcript</h2><div style="color:#16324F;font-size:16px;line-height:24px;white-space:pre-wrap">${escapeHtml(transcript)}</div>`
    : `<h2 style="color:#16324F;font-size:20px;line-height:28px;margin:32px 0 12px">Transcript</h2><p style="color:#64748B;font-size:16px;line-height:24px;margin:0">Transcript unavailable. The call recording may still be available.</p>`;

  return {
    subject: `Bat Phone — Call Transcript: ${contactName}`,
    html: [
      '<div style="background:#F7F9FC;padding:24px 12px">',
      '<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;font-family:Arial,sans-serif;margin:0 auto;max-width:560px;padding:24px">',
      '<h1 style="color:#16324F;font-size:28px;line-height:34px;margin:0 0 24px">Call Transcript</h1>',
      `<p style="color:#16324F;font-size:16px;line-height:26px;margin:0"><strong>Caller:</strong> ${escapeHtml(recipient)}<br>`,
      `<strong>Destination:</strong> ${escapeHtml(contactName)}<br>`,
      `<strong>Phone Number:</strong> ${escapeHtml(call.destination_number ?? "Unavailable")}<br>`,
      `<strong>Call Start Time:</strong> ${escapeHtml(formatStartTime(call.start_time))}<br>`,
      `<strong>Call Duration:</strong> ${escapeHtml(formatDuration(call.recording_duration ?? call.duration))}</p>`,
      transcriptSection,
      '<h2 style="color:#16324F;font-size:20px;line-height:28px;margin:32px 0 12px">Recording / View Call</h2>',
      `<p style="font-size:16px;line-height:24px;margin:0"><a href="${escapeHtml(detailUrl)}" style="color:#2563EB;font-weight:600">View call and recording</a></p>`,
      "</div>",
      "</div>",
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
  // Email delivery is claimed in the database first so duplicate transcription
  // callbacks do not fan out duplicate transcript emails.
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
