# Source Map

This file is the developer's map of the Bat Phone source tree. Use `README.md` for setup, `docs/ARCHITECTURE.md` for system behavior, and `PROCESS.md` for the historical implementation journal.

## Top-level structure

### `src/app`

Owns App Router pages, route handlers, loading states, and authenticated Server Actions.

Look here when you want to:

- change a page or navigation flow
- update a route handler under `app/api`
- modify auth redirects or onboarding behavior
- trace which server-rendered page loads which data

Current route groups:

- root app shell
  - `layout.tsx`: global layout, font wiring, and bottom navigation mount point
  - `globals.css`: global styling tokens and base styles
  - `loading.tsx`: top-level loading skeleton
  - `page.tsx`: root redirect to `/contacts`
- `account`
  - `page.tsx`: signed-out entry point and signed-in account view
  - reads the current Supabase user and profile phone number
- `auth`
  - `callback/route.ts`: Supabase OAuth code exchange and safe post-login redirect handling
- `calls`
  - `page.tsx`: current user's call history
  - `[id]/page.tsx`: per-call detail page
  - `[id]/not-found.tsx`: shared missing/non-owned call state
  - `loading.tsx`: loading skeleton for call routes
- `contacts`
  - `page.tsx`: contacts landing page
  - `actions.ts`: authenticated create/update/delete Server Actions for contacts
- `onboarding`
  - `page.tsx`: first-time phone-number setup screen
  - `actions.ts`: authenticated profile phone save action
- `api`
  - integration surface for Twilio and recording playback

### `src/components`

Owns reusable UI and client-side interaction layers.

Look here when you want to:

- change interactive forms without moving server data access
- update presentational call/contact/account UI
- edit local UI primitives and shared app chrome

Current groups:

- `auth`
  - `auth-button.tsx`: Google sign-in / sign-out trigger via Supabase
  - `account-phone-form.tsx`: edit existing caller phone number
  - `onboarding-form.tsx`: first-time caller phone capture
- `calls`
  - `call-history.tsx`: list view for calls
  - `call-detail.tsx`: detail view, recording player, transcript rendering
- `contacts`
  - `contact-manager.tsx`: client-side add/edit/delete state and form handling
- `ui`
  - local shadcn-style primitives such as `button`, `card`, `input`, `badge`, and `tabs`
- shared app components
  - `bottom-nav.tsx`: persistent bottom navigation for Contacts, Calls, and Account

### `src/lib`

Owns framework-agnostic business logic, validation, data formatting, integration helpers, and Twilio/Resend orchestration.

Look here when you want to:

- change domain rules without rewriting page structure
- update validation or formatting behavior shared across pages/components
- understand how Twilio callbacks are validated and processed
- trace transcript generation or post-call email behavior

Important modules:

- `calls.ts`
  - shared `CallRecord` shape, Supabase select list, call status labeling, duration formatting, time formatting, and transcript parsing
- `contact-validation.ts`
  - canonical phone formatting and validation, contact-name normalization, and shared Server Action result types
- `safe-return-path.ts`
  - internal-only redirect target validation for login return paths
- `application-url.ts`
  - absolute URL helpers for links included in email content
- `email/`
  - `call-transcript.ts`: Resend email sender plus transcript/fallback email construction
- `twilio/`
  - Twilio-specific voice, callback validation, persistence, recording fetch, transcription, and logging modules
- `utils.ts`
  - shared `cn()` class name helper

### `src/test`

Owns global test setup.

- `setup.ts`: loads `@testing-library/jest-dom` matchers and mocks `server-only` for Vitest

### `src/utils`

Owns environment-specific helpers that do not fit better in `lib`, especially Supabase client creation.

### `src/proxy.ts`

Owns request-time auth guarding for protected browser routes. It refreshes Supabase cookies and redirects unauthenticated access for `/contacts`, `/calls`, and `/onboarding` to `/account`.

## `src/app/api`

### `api/calls`

- `calls/[callId]/recording/route.ts`
  - authenticated recording proxy
  - verifies the current browser user owns the call before streaming Twilio media back as `audio/mpeg`
  - the browser uses this route instead of a raw Twilio media URL

Look here when you want to change recording playback behavior or the auth/ownership check around recordings.

### `api/twilio`

- `incoming/route.ts`
  - first voice webhook
  - validates signature and returns the initial gather prompt or rejection message
- `resolve-contact/route.ts`
  - handles speech/DTMF contact resolution and returns retry, hangup, or dial TwiML
- `dial-complete/route.ts`
  - stores final dial outcome and duration
- `recording/route.ts`
  - stores recording metadata and kicks off batch transcription submission
- `transcription/route.ts`
  - validates the raw JSON callback, correlates `sourceId` to `recording_sid`, stores transcript state, and sends the transcript/fallback email

Look here when you want to change webhook handling, payload validation, or the shape of the Twilio integration boundary.

## `src/lib/twilio` module guide

| Module | What it owns | When to open it |
| --- | --- | --- |
| `voice-flow.ts` | TwiML generation for inbound, gather, dial-complete, and failure paths | Change the voice prompt, gather behavior, or `<Dial>` configuration |
| `contact-matching.ts` | Deterministic exact / case-insensitive / fuzzy contact matching | Change how spoken names resolve to contacts |
| `telephony-repository.ts` | Service-role Supabase persistence for profiles, contacts, call creation, dial updates, and recording updates | Understand or change Twilio-side database writes |
| `call-idempotency.ts` | Idempotent create-before-dial contract keyed by `twilio_call_sid` | Understand duplicate webhook handling for call creation |
| `request-validation.ts` | Twilio signature validation for form and JSON callbacks, including externally visible URL handling | Understand Twilio authentication and why raw-body validation matters |
| `batch-transcription.ts` | Twilio Batch Transcription submission, callback parsing, transcript building, and post-callback workflow | Change transcription handling or callback processing |
| `phase4-repository.ts` | Atomic transcription/email claims plus transcript/email state persistence | Understand retry/idempotency behavior after recording completion |
| `recording-media.ts` | Server-side fetch of Twilio recording media with Basic auth | Change recording playback fetch behavior |
| `logging.ts` | Structured Twilio integration logging | Change event names or error logging shape |
| `environment.ts` | Server-only Twilio environment accessors | Check which Twilio variables are required |
| `parse-duration.ts` | Safe numeric parsing for Twilio duration fields | Adjust shared duration parsing rules |

## `src/utils/supabase`

- `client.ts`
  - browser/client Supabase
  - uses the public URL plus publishable key
  - intended for client components such as the sign-in/sign-out button
- `server.ts`
  - cookie-based server Supabase
  - intended for Server Components, Server Actions, and route handlers that act on behalf of the signed-in browser user
- `admin.ts`
  - service-role admin Supabase
  - server-only privileged client for trusted backend flows such as Twilio callbacks and post-call processing
- `public-env.ts`
  - shared validation for the public Supabase URL and publishable key

In practice:

- use `client.ts` when code runs in the browser
- use `server.ts` when code should honor the current user's session and RLS
- use `admin.ts` only for trusted server-side work that cannot run as a browser user

## Where do I look if I want to...

- change the voice prompt: `src/lib/twilio/voice-flow.ts`
- change contact matching: `src/lib/twilio/contact-matching.ts` and `src/app/api/twilio/resolve-contact/route.ts`
- change call-history display: `src/app/calls/page.tsx`, `src/components/calls/call-history.tsx`, and `src/lib/calls.ts`
- change recording playback: `src/app/api/calls/[callId]/recording/route.ts`, `src/lib/twilio/recording-media.ts`, and `src/components/calls/call-detail.tsx`
- change transcription handling: `src/app/api/twilio/recording/route.ts`, `src/app/api/twilio/transcription/route.ts`, `src/lib/twilio/batch-transcription.ts`, and `src/lib/twilio/phase4-repository.ts`
- change email template: `src/lib/email/call-transcript.ts`
- change login handling: `src/components/auth/auth-button.tsx`, `src/app/auth/callback/route.ts`, `src/lib/safe-return-path.ts`, and `src/proxy.ts`
- change phone validation: `src/lib/contact-validation.ts`, `src/app/onboarding/actions.ts`, and `src/app/contacts/actions.ts`
- understand Supabase access: `src/utils/supabase/client.ts`, `src/utils/supabase/server.ts`, `src/utils/supabase/admin.ts`, plus the RLS policies in `supabase/migrations/20260901200201_initial_auth_contacts.sql`
- understand Twilio authentication: `src/lib/twilio/request-validation.ts` and the Twilio route handlers in `src/app/api/twilio`
