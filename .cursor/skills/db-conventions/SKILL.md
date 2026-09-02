---
name: db-conventions
description: Bat Phone's database schema and data-lifecycle conventions. Use whenever writing queries, migrations, or anything touching users, contacts, or calls.
---

TABLES (Supabase/Postgres)
users: id, google_id, email, phone_number, created_at
contacts: id, user_id (FK -> users), name, phone_number
calls: id, user_id (FK), contact_id (FK, nullable), contact_name_snapshot, destination_number, twilio_call_sid, status, start_time, duration, recording_url, transcript, created_at

CONVENTIONS
- contact_name_snapshot exists so renaming/deleting a contact never changes historical call records.
- Create the calls row the moment a call STARTS (status: in_progress), not after it ends. Update the same row as events land (recording ready, transcript ready, status: completed/failed). Never write the whole row only at the end.
- Use twilio_call_sid as an idempotency key on every webhook handler that touches a calls row — Twilio retries webhooks, so check "have I already processed this SID" before writing.
