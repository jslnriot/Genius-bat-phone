---
name: db-conventions
description: Bat Phone's database schema and data-lifecycle conventions. Use whenever writing queries, migrations, or anything touching profiles, contacts, or calls.
---

IDENTITY
There is no public `users` table and no `google_id` column. Sign-in is Supabase Auth (`auth.users`, Google OAuth). App rows hang off `public.profiles`.
- `profiles.id` = `auth.users.id` (PK, ON DELETE CASCADE)
- Trigger `private.handle_new_user()` inserts `profiles (id, email)` after each `auth.users` insert
- `profiles.phone_number` stays null until onboarding; uniqueness identifies the inbound caller

TABLES (public schema)
profiles: id (uuid PK, FK -> auth.users), email, phone_number (nullable, unique, E.164 `+1` + 10 digits or null), created_at
contacts: id, user_id (FK -> profiles ON DELETE CASCADE), name, phone_number (E.164, required), created_at
calls: id, user_id (FK -> profiles), contact_id (FK -> contacts ON DELETE SET NULL), contact_name_snapshot, destination_number, twilio_call_sid (unique), status, start_time, duration, recording_url, recording_sid (unique), recording_duration, transcript, transcription_id (unique), transcription_status, transcription_attempts, email_status, email_attempts, email_sent_at, created_at

CONSTRAINTS that affect writes
- contacts.name: trimmed length 1–50; letters, spaces, periods, apostrophes, hyphens (`contacts_name_characters_check` is NOT VALID for one historical row)
- contacts.phone_number and non-null profiles.phone_number: `^\+1[0-9]{10}$`
- transcription_status: null or pending | processing | completed | failed
- email_status: null or pending | sent | failed | skipped
- recording_duration, transcription_attempts, email_attempts: non-negative
- RLS: authenticated users may only CRUD their own profiles/contacts/calls (`auth.uid()` = profiles.id or user_id). User-facing pages and Server Actions use the cookie client. Twilio webhooks use the service-role admin client and bypass RLS.

CONVENTIONS
- contact_name_snapshot exists so renaming/deleting a contact never changes historical call records. Deleting a contact sets calls.contact_id to null.
- Create the calls row the moment a call STARTS (status: in_progress), before dialing, not after it ends. Update the same row as events land (dial result, recording ready, transcript ready, email). Never write the whole row only at the end. Dial completion writes status busy | canceled | completed | failed | no-answer and optional duration.
- Use twilio_call_sid as an idempotency key on every webhook handler that touches a calls row — Twilio retries webhooks, so check "have I already processed this SID" before writing. The column is unique; inserts upsert with ignoreDuplicates on twilio_call_sid. Retries must reuse the existing destination rather than creating or changing a call.
- Correlate recording callbacks by twilio_call_sid. Correlate transcription callbacks by recording_sid (Twilio `sourceId`). Claim transcription (`transcription_status` null → pending) and email (`email_status` null → pending) atomically so retries cannot submit twice.
