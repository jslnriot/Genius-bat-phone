alter table public.calls
  add column recording_sid text,
  add column recording_duration integer;

alter table public.calls
  add constraint calls_recording_sid_key unique (recording_sid),
  add constraint calls_recording_duration_nonnegative_check
  check (recording_duration is null or recording_duration >= 0);

comment on column public.calls.recording_sid is
  'Twilio recording SID received from the completed recording callback.';

comment on column public.calls.recording_duration is
  'Final recording duration in seconds; distinct from the bridged call duration.';
