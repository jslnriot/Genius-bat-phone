alter table public.calls
  add column transcription_id text,
  add column transcription_status text,
  add column transcription_attempts integer not null default 0,
  add column email_status text,
  add column email_attempts integer not null default 0,
  add column email_sent_at timestamptz;

alter table public.calls
  add constraint calls_transcription_id_key unique (transcription_id),
  add constraint calls_transcription_status_check
    check (
      transcription_status is null
      or transcription_status in ('pending', 'processing', 'completed', 'failed')
    ),
  add constraint calls_transcription_attempts_nonnegative_check
    check (transcription_attempts >= 0),
  add constraint calls_email_status_check
    check (email_status is null or email_status in ('pending', 'sent', 'failed', 'skipped')),
  add constraint calls_email_attempts_nonnegative_check
    check (email_attempts >= 0);

comment on column public.calls.transcription_id is
  'Twilio Batch Transcription job ID.';

comment on column public.calls.transcription_status is
  'Batch transcription lifecycle: pending, processing, completed, or failed.';

comment on column public.calls.transcription_attempts is
  'Number of Twilio Batch Transcription submission attempts.';

comment on column public.calls.email_status is
  'Transcript or fallback email lifecycle: pending, sent, failed, or skipped.';

comment on column public.calls.email_attempts is
  'Number of Resend delivery attempts.';

comment on column public.calls.email_sent_at is
  'Time the transcript or fallback email was accepted by Resend.';
