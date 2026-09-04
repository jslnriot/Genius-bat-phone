# Process Journal

This file is the chronological implementation journal for Bat Phone. It is intentionally historical and can include earlier phase notes, manual QA notes, and implementation-time decisions that are no longer the best summary of the current architecture.

Use the documents this way:

- `README.md`: setup and quickest review paths
- `docs/ARCHITECTURE.md`: current system behavior and integration flow
- `src/README.md`: source-tree map and developer navigation
- `PROCESS.md`: historical build journal and AI-assisted engineering record

The journal entries below are preserved as history rather than rewritten into a current-state architecture description.

# Process

Working journal of each prompt — what shipped, and what it took to run.

---

## Prompt 1 — Initial scaffold (2026-09-01)

Structure and styling only. No auth, database, or Twilio.

**Shipped**
- Cursor skills: `.cursor/skills/style-guide/SKILL.md`, `.cursor/skills/db-conventions/SKILL.md`
- Next.js App Router app with Geist Sans, Tailwind, shadcn-style UI (button, input, card, badge, tabs), lucide-react
- Mobile layout (`max-width: 480px`, centered)
- Bottom nav: Contacts, Calls, Account
- Placeholder routes: `/contacts`, `/calls`, `/account`

**Versions**
| Package | Version |
|---|---|
| Node | 24.10.0 (nvm, `.nvmrc`) |
| Next.js | 16.3.4 |
| React | 19.2.x |
| Tailwind CSS | 4.3.3 (`@tailwindcss/postcss`) |
| TypeScript | 5.9.x |

Node must be **≥ 20.9.0** (Next 16 requirement). This Mac is Apple Silicon; the active Node 24.10.0 install is the **x64** (Rosetta) build.

**Getting it running**

1. First `npm install` ran under Node 18. Tailwind 4’s native `@tailwindcss/oxide` package requires Node ≥ 20, so the platform binding never installed and `globals.css` failed (missing `@tailwindcss/oxide-darwin-x64` on this machine).
2. Cleaned and reinstalled under Node 24.10.0:

```bash
nvm use 24.10.0
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

Oxide picks the binary for the OS/CPU of whatever machine runs `npm install` (macOS x64, macOS arm64, Linux x64 for Codespaces, etc.). Do not pin Darwin-only packages in `package.json` — that only covers this Mac.

App then started at `http://localhost:3000` (redirects to `/contacts`).

---

## Prompt 2 — Supabase auth and contacts (2026-09-01)

Added Supabase SSR clients, Google OAuth callback, session-refresh proxy, protected routes, phone-number onboarding, signed-in account details, and per-user contact CRUD.

Created a CLI migration for `profiles`, `contacts`, and `calls`, including the new-user profile trigger, ownership indexes, explicit authenticated-role grants, and RLS policies for every operation. Runtime Supabase configuration is stored only in the git-ignored `.env.local`; no credential values are documented here.

Installed pinned `@supabase/supabase-js` 2.112.4 and `@supabase/ssr` 0.12.5. Next.js 16 uses `src/proxy.ts` in place of the deprecated `middleware.ts` convention.

Validation: `npx tsc --noEmit` and `npm run build` pass. The remote schema migration was later applied after CLI project access was restored.

**Google OAuth setup**
- Added the local app callback to Supabase Auth’s redirect allow list.
- Enabled the Google provider in Supabase.
- Google requires two separate values from a Web OAuth client: a client ID and client secret. These belong only in the Supabase provider settings and must not be committed or documented.
- Google Cloud’s authorized redirect URI must point to Supabase’s Auth callback; Supabase then redirects back to the app callback.

Current status: application code and database migrations are ready. Google OAuth provider credentials must be configured in the provider dashboards before the full sign-in flow can be verified.

---

## Prompt 3 — Contact validation (2026-09-01)

Added inline contact-name validation, automatic US phone formatting, 10-digit checks, and E.164 conversion for contact and onboarding forms. Existing E.164 contact numbers are converted back to the display format when edited.

Moved contact/profile writes into authenticated Next.js Server Actions. Inputs are validated again on the server before Supabase is called, and expected failures return clean UI messages.

Added and pushed a separate database migration with name-length and E.164 `CHECK` constraints. The migration normalized one existing display-formatted profile number before applying the constraints.

Validation assertions covered empty and overlong names, incomplete numbers, stripped non-digits, valid formatting, and E.164 conversion. Rollback-only remote database tests confirmed invalid values are rejected, nullable profile numbers remain allowed, and valid values are accepted. TypeScript and the production build pass.

---

## Prompt 4 — Contact name characters (2026-09-01)

Expanded shared contact-name validation to accept Unicode letters, spaces, apostrophes, periods, and hyphens while rejecting numbers, other symbols, and emoji. Names are Unicode-normalized, trimmed, and repeated whitespace is collapsed before storage.

The same rule runs inline in the contact form and again in the authenticated Server Actions. A separate database constraint migration was pushed and verified with rollback-only tests.

One historical contact already violates the new character rule. The constraint was added as `NOT VALID` so existing data was not silently changed; it still blocks invalid new or updated rows. Editing that contact will require correcting its name.

---

## Prompt 5 — Contact unit tests (2026-09-01)

Added Vitest, jsdom, and React Testing Library with pinned versions. Contact Server Actions are mocked so tests remain isolated from Supabase.

Three component tests cover validation plus adding a contact with E.164 conversion, loading and changing an existing contact, and deleting a contact back to the empty state. Run once with `npm test` or continuously with `npm run test:watch`.

---

## Prompt 6 — Environment portability (2026-09-02)

Added an empty environment template, a minimal Node 24.10.0 Codespaces dev container, and setup instructions for local development, Vercel, and GitHub Codespaces.

Documented the Supabase Auth URL allowlist and clarified that Google OAuth continues to redirect through Supabase. The existing origin-based application callback remains unchanged so dynamic hosts work without hardcoded URLs.

---

## Prompt 7 — Core telephony flow (2026-09-02)

Added signed Twilio Voice webhooks for incoming calls, deterministic contact resolution, `<Dial>` bridging, dial completion, and completed recording callbacks. Contact matching uses normalized exact/case-insensitive matching followed by conservative edit-distance matching; callers can also select from up to nine contacts with DTMF and receive one retry.

Twilio system operations use a dedicated server-only Supabase admin client. A call row is created before dialing and keyed by the unique parent `CallSid`; retries reuse the existing destination rather than creating or changing a call. Dual-channel recording stores its SID, URL, and separate recording duration, but Phase 3 does not transcribe or send email.

Two migrations were pushed: recording metadata was added to `calls`, and profile phone numbers were made unique because the incoming E.164 number identifies the caller. Focused tests cover name matching, registered/unknown caller TwiML, the configured Dial response, and idempotent call creation.

---

## Prompt 8 — Transcription and email (2026-09-02)

Phase 4 extends the completed recording callback without changing the working inbound, contact-resolution, dialing, or recording flow. After recording metadata is stored, the application claims the call row and submits `calls.recording_sid` as `sourceId` to `POST https://voice.twilio.com/v3/Transcriptions`. The reusable Twilio `transcriptionConfigurationId` comes from `TWILIO_TRANSCRIPTION_CONFIGURATION_ID`.

Twilio Batch Transcription processes asynchronously and sends an `application/json` result to `POST https://genius-bat-phone.vercel.app/api/twilio/transcription`. The callback correlates `sourceId` exclusively to `calls.recording_sid`, stores the returned job `id`, orders sentence text chronologically, and saves the readable result in `calls.transcript`.

JSON callbacks use the Twilio SDK's `validateRequestWithBody` path with the exact externally visible URL, including `bodySHA256`, and the untouched raw request body. Existing form-encoded Voice callbacks continue using the centralized form validation path.

Transcription submission is claimed atomically in Postgres before the external request. A submission is attempted twice total; after the second failure the call is marked `transcription_status = failed` and receives a fallback recording email. Completed and failed Twilio callbacks do not create replacement jobs.

Email delivery is also claimed atomically. Resend receives at most two application attempts with a stable per-call idempotency key. Success records `email_status = sent` and `email_sent_at`; final failure preserves the call, transcript, and recording. If the initiating user's email is unavailable, delivery is marked skipped. The destination contact is never an email recipient.

Successful emails contain caller, destination, phone number, call start, duration, transcript, and recording link. Failed transcriptions produce the same metadata with “Transcript unavailable” and the recording link.

The existing `<Dial record="record-from-answer-dual">` setting is already compatible and was not changed. Twilio documents the parent inbound caller on channel 1 and the outbound child call on channel 2, which matches the recommended `CUSTOMER` / `HUMAN_AGENT` participant defaults. Dual channel improves speaker attribution; Batch Transcription can accept Recording SIDs directly.

Deepgram Nova 3 is selected inside the Twilio Transcription Configuration. The application does not call Deepgram and does not require a Deepgram API key.

Twilio Batch Transcription Configurations remain Public Beta, are not covered by Twilio's SLA, and may change. Without a Twilio Conversation Configuration, a completed transcript cannot be recovered if Twilio exhausts callback delivery retries.

---

## Phase 5 — Call history and transcript detail (2026-09-02)

The authenticated `/calls` route now reads calls through the normal cookie-based
Supabase server client. The existing `calls_select_own` RLS policy is the primary
ownership boundary; the query also filters by the authenticated user's ID and
orders `start_time` newest first. No service-role client or new database state is
used by the browser-facing call UI.

`/calls/[id]` loads one call through the same RLS path and repeats the explicit
`user_id` filter. Missing and non-owned IDs both return Next.js not-found
behavior. Recordings play in the native HTML audio element from
`/api/calls/[callId]/recording`. That endpoint authenticates the request,
performs its own owner-filtered lookup, and proxies authenticated Twilio media;
Twilio recording URLs and credentials never reach the browser.

User-facing status is centralized and derived from existing fields:

- active call status → `Calling`
- failed, busy, canceled, or no-answer call → `Failed`
- pending/processing transcription → `Transcribing`
- completed transcription with text → `Transcript Ready`
- failed transcription → `Transcript Unavailable`
- otherwise → `Completed`

The call list and detail use `recording_duration` when available, then fall back
to `duration`. Transcript text is preserved and only split into typographic
speaker sections for display. Transcript emails now link to `/calls/[id]`
instead of the recording API and use simple email-safe spacing and typography.

No migration was required. Existing RLS, call lifecycle fields, and recording
proxy already support Phase 5.

### Edge cases verified

- Unknown callers hear that their number is not registered, then the call hangs
  up. `twilio.unknown_caller_rejected` is logged without the inbound number.
- Unresolved speech receives one retry with the existing speech/DTMF menu, then
  a clear exit. `twilio.contact_unresolved` logs the call SID, attempt, and
  retry/hangup outcome without speech text.
- Failed transcription remains visible as `Transcript Unavailable`; its
  recording stays playable and the fallback email path remains unchanged.
- Twilio dial outcomes are persisted on the existing call (`failed`, `busy`,
  `canceled`, `no-answer`, or `completed`) and mapped to concise UI labels.
  Route failures continue to produce structured server logs and safe TwiML.
- Email failure changes only `email_status`; transcript, recording, and call
  detail remain available and the UI does not treat email failure as call
  failure.
- If either participant disconnects, Twilio completes/cancels the dial leg and
  invokes the existing dial/recording callbacks for the media captured up to
  disconnection. The final provider callback determines persisted duration and
  status.

### Failure-path manual QA checklist

Use a dedicated test user/contact and inspect structured function logs by event
name. Do not change production credentials to manufacture failures.

**UNKNOWN CALLER**

1. Call Bat Phone from a number not assigned to any Bat Phone profile.
2. Confirm: “This phone number is not registered with Bat Phone.”
3. Confirm graceful hangup and one `twilio.unknown_caller_rejected` log entry
   that does not contain the caller's phone number.

**UNRESOLVED CONTACT**

1. From a registered number, say a nonsense name.
2. Confirm one retry and that the prompt still offers numbered DTMF contacts.
3. Repeat the nonsense name (or provide an invalid digit).
4. Confirm the graceful unresolved-contact message and hangup.
5. Confirm `twilio.contact_unresolved` logs `retry`, then `hangup`, without the
   spoken phrase.

**TRANSCRIPTION FAILURE**

- Do not break the production transcription configuration. The fallback was
  already manually verified in production, and automated tests inject a failed
  provider response to verify two attempts, persisted failed status, and the
  fallback email. If manual re-verification is required, use an isolated
  non-production deployment and test Twilio configuration.
- Confirm the call remains in history, the detail says “Transcript
  unavailable,” and the recording still plays.

**TWILIO ERROR**

- Safe routine check: call a test contact number you control and deliberately
  decline or let it time out. Confirm the call remains in history as `Failed`,
  with a `busy` or `no-answer` structured dial-completion log.
- Use mocked route tests for provider/API exceptions. Do not invalidate
  production Twilio credentials merely to force an API error.

**EMAIL FAILURE**

- Prefer the automated sender mock, which rejects both attempts and verifies
  only `email_status` becomes failed.
- If a manual check is required, use an isolated non-production deployment with
  a non-delivering Resend test setup and one test recipient. Do not alter
  production credentials or send repeated messages.
- Confirm transcript and recording remain available in the call detail.

**NETWORK DROP / CALL INTERRUPTION**

1. During a call between two test numbers you control, disconnect one side.
2. Confirm the other side receives the normal end-of-call behavior.
3. Confirm the call remains in history and uses the final callback duration.
4. If a recording was finalized, confirm playback and transcription continue;
   otherwise confirm the subdued recording/transcript unavailable states.

### Known limitations

- History intentionally has no pagination for the current POC dataset.
- Status updates appear on navigation or refresh; there is no realtime polling.
- Native browser audio controls vary slightly by platform.
- Twilio Batch Transcription remains Public Beta, with the recovery limitation
  documented in Phase 4.

---

## Phase 6 Bug Bash — Pass 5: Transcription and email failure states (2026-09-04)

Audited items 16 (transcript failure) and 17 (email failure). No pipeline
redesign, schema changes, or credential tampering. Production behavior was
already correct; this pass added focused tests for previously uncovered edge
cases.

**Retry policy (unchanged)**

- Transcription submission: 2 immediate attempts via
  `submitRecordingForTranscription`, persisting `transcription_attempts` and
  marking `transcription_status = failed` after the second failure.
- Email delivery: 2 immediate Resend attempts via `sendCallEmail`, persisting
  `email_attempts` and marking `email_status = failed` after the second failure.

**Terminal persistence (unchanged)**

- Transcription failure: `transcription_status = failed` (submission failure,
  provider failed callback, or completed callback with no usable sentences).
- Email failure: `email_status = failed`; transcript, recording metadata, and
  call row remain unchanged.
- Email skipped when the initiating user has no resolvable address.

**Idempotency (unchanged)**

- Transcription: atomic `claimTranscription` (null → pending); duplicate
  recording webhooks and completed callbacks are ignored.
- Email: early return when `email_status !== null`; atomic `claimEmail`
  (null → pending); Resend idempotency key `bat-phone-call-${call.id}`.
- Duplicate failed transcription callbacks do not resend email when delivery
  is already sent or in progress.

**UI status derivation (unchanged)**

- Badges derive from dial outcome and transcription fields only; `email_status`
  is backend/ops state and is intentionally not shown in call history or detail.
- Failed transcription → subdued **Transcript Unavailable** badge; recording
  remains playable when `recording_sid` exists.
- Email failure does not surface as call **Failed** when the transcript is
  stored and dial status is completed.

**Tests added**

- `batch-transcription.test.ts`: attempt persistence on final submission
  failure; duplicate failed callback idempotency (email sent / pending).
- `call-transcript.test.ts`: fallback HTML, early return when already sent,
  lost `claimEmail` race, `markEmailSkipped` when no recipient.
- `calls.test.ts`: email failure invisibility in `getCallStatus`.
- `call-history.test.tsx`: **Transcript Unavailable** badge in list.
- `call-detail.test.tsx`: header badge; failed transcription without recording.

**Safe manual QA vs automated proof**

- **Prefer mocked tests** for Twilio submission failure, transcription callback
  failure, Resend rejection, and duplicate callback/idempotency paths. Do not
  invalidate production Twilio or Resend credentials to force failures.
- **Safe manual spot-check (dev/staging only):** set `transcription_status =
  'failed'` and `transcript = null` on a call with `recording_sid`; confirm
  history badge, detail copy, and audio playback. For email failure invisibility,
  set `email_status = 'failed'` on a completed call with transcript; UI should
  still show **Transcript Ready**.
- End-to-end provider failure injection is impractical in the demo environment;
  automated mocks are the authoritative proof.

Validation: `npm test`, `npx tsc --noEmit`, and `npm run build` on Node 24.10.0.

---

## Phase 6 — Code cleanup (2026-09-04)

Performed a conservative cleanup pass without changing Bat Phone's schema,
authentication model, Twilio flow, transcription flow, email flow, or route
structure.

**Cleanup shipped**
- Replaced repeated Supabase public env non-null assertions with a shared
  validated helper used by the browser, server, proxy, and admin clients.
- Replaced repeated Twilio env lookup / Basic auth construction with a shared
  helper, and extracted the duplicated Twilio duration parser used by the dial
  completion and recording callbacks.
- Removed small dead/unused indirections: the unused exported transcription URL,
  the unused `Contact` alias, extra exported request-validation types, and the
  unused `status` parameter on `twimlResponse`.
- Shared the call-row select string between `/calls` and `/calls/[id]`.
- Updated README validation instructions and documented the authenticated call
  history/detail recording flow.
- Renamed one misleading `calls.test.ts` case so it matches what the test
  actually proves.

**Intentionally left alone**
- `Phase4` repository naming remains as-is because renaming it would touch many
  imports for little review value.
- Existing structured Twilio and authorization error logging remains in place.
- Supabase row casts (`as CallRecord`, `as ContactRecord[]`) remain until
  generated DB types exist; removing them safely would be a larger typing task.

Validation: `npm test`, `npx tsc --noEmit`, `npm run build`, and `npm run lint`
on Node 24.10.0.
