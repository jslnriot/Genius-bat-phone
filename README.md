# Bat Phone

Take-home full-stack project for Genius: an AI-assisted employee calling tool.

## Quick Start

### Live application

Production demo: [https://genius-bat-phone.vercel.app](https://genius-bat-phone.vercel.app)

- This is the deployed demonstration environment.
- Authentication is still required before using the app.
- Supabase, Twilio, and Resend are already configured there.

### Local development

1. Clone the repository.
2. `nvm use`
3. `cp .env.example .env.local`
4. Populate the required environment values.
5. `npm ci`
6. `npm run dev`
7. Open [http://localhost:3000](http://localhost:3000)

For Supabase, Twilio, Resend, and OAuth provider details, use the setup sections further down in this README.

### GitHub Codespaces

1. Create or open a Codespace for the repository.
2. Repository-scoped Codespaces secrets are injected as environment variables.
3. The dev container installs dependencies with `npm ci`.
4. Run `npm run dev`.
5. Open forwarded port `3000`.

This repository currently forwards port `3000` and runs `npm ci` via `postCreateCommand`. If a reviewer does not have access to the repository's Codespaces secrets, they will need the same environment values supplied another way.

### Validation

```bash
npm test
npx tsc --noEmit
npm run build
npm run lint
```

## How the project is organized

- `README.md`: setup, environment requirements, and the fastest ways to run or review the app.
- `docs/ARCHITECTURE.md`: how the system works end to end, including auth, voice, transcription, email, and security boundaries.
- `src/README.md`: where the implementation lives and which files to open for specific changes.
- `PROCESS.md`: chronological implementation journal for the build-out and cleanup passes.

## Tech stack snapshot

| Area | Current implementation | Notes |
| --- | --- | --- |
| Application | Next.js 16.3.4 App Router, React 19.2.8, TypeScript 5.9.2 | Single Next.js application for UI, Server Actions, and route handlers |
| UI | Tailwind CSS 4.3.3, local shadcn-style primitives in `src/components/ui`, Lucide React, Geist via `next/font` | UI primitives are local components, not an externally hosted design system |
| Authentication / data | Supabase Auth, Google OAuth through Supabase, Supabase Postgres, Row Level Security | Browser data access uses authenticated Supabase clients plus RLS |
| Telephony | Twilio Programmable Voice, TwiML, dual-channel recording on `<Dial>` | Twilio drives the inbound number, prompts, bridging, and callbacks |
| Transcription | Twilio Batch Transcription, Twilio-managed transcription configuration, Deepgram Nova-3 configured inside Twilio | The app submits `RecordingSid` jobs to Twilio and does not call Deepgram directly |
| Email | Resend | Sends transcript or fallback post-call email to the initiating employee |
| Hosting / reproducibility | Vercel production deployment, GitHub Codespaces dev container | Codespaces is documented for reviewer reproducibility |
| Testing / quality | Vitest 4.1.11, React Testing Library 16.3.3, TypeScript checks, ESLint 9.16.0 | `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run lint` |

## Environment variables

Bat Phone requires these variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_TRANSCRIPTION_CONFIGURATION_ID
RESEND_API_KEY
RESEND_FROM_EMAIL
```

Copy `.env.example` when setting up a new environment, but never commit populated environment files or credentials. Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. `SUPABASE_SECRET_KEY` and all `TWILIO_*` values are server-only and must only be configured in trusted local, Codespaces, and Vercel environments.

## Local development

Use Node.js 24.10.0, as specified in `.nvmrc`.

```bash
nvm use
cp .env.example .env.local
npm ci
npm run dev
```

Add the required values to `.env.local`. The app runs at [http://localhost:3000](http://localhost:3000).

## Validation

Run the automated checks with:

```bash
npm test
npx tsc --noEmit
npm run build
npm run lint
```

Use `npm run test:watch` during local development.

## Vercel

In the Vercel project settings, add all variables listed in `.env.example` under Environment Variables. Configure them for every Vercel environment that should run the app, then redeploy after changing a value.

Production is hosted at [https://genius-bat-phone.vercel.app](https://genius-bat-phone.vercel.app).

## GitHub Codespaces

Add all variables listed in `.env.example` as GitHub Codespaces repository secrets. New codespaces receive them as environment variables.

The dev container installs Node.js 24.10.0, runs `npm ci`, and forwards port 3000 automatically. Start the app with:

```bash
npm run dev
```

If an existing codespace predates the dev-container configuration, rebuild its container.

## Supabase Auth URL configuration

In Supabase Dashboard → Authentication → URL Configuration, use:

Site URL:

```text
https://genius-bat-phone.vercel.app
```

Redirect URLs:

```text
http://localhost:3000/auth/callback
https://genius-bat-phone.vercel.app/auth/callback
https://*-3000.app.github.dev/auth/callback
```

The application intentionally derives `/auth/callback` from the current browser/request origin. This supports localhost, production, and dynamically named Codespaces without hardcoded application hostnames. Each resulting URL must remain in Supabase's redirect allowlist.

Google Cloud's OAuth Authorized Redirect URI is different: it continues to point to the Supabase Auth callback, typically `https://<project-ref>.supabase.co/auth/v1/callback`. It does not change between localhost, Vercel, and Codespaces.

## Twilio Voice webhook

After deploying to Vercel, configure the Bat Phone number's **A call comes in** webhook as:

```text
POST https://genius-bat-phone.vercel.app/api/twilio/incoming
```

The application returns TwiML that directs Twilio to these signed form POST callbacks; they do not need separate Twilio Console configuration:

```text
https://genius-bat-phone.vercel.app/api/twilio/resolve-contact
https://genius-bat-phone.vercel.app/api/twilio/dial-complete
https://genius-bat-phone.vercel.app/api/twilio/recording
```

Every Twilio route validates `X-Twilio-Signature` against the exact public request URL. Form callbacks validate all form parameters. The Batch Transcription JSON callback validates the unmodified request body and Twilio's `bodySHA256` query parameter. Local webhook testing therefore requires an HTTPS tunnel whose URL is configured in Twilio; requests sent directly to localhost will not have a valid production signature.

Phase 3 bridges the inbound caller to a deterministically matched contact with `<Dial>`, creates the call record before dialing, and records both call legs on separate channels.

For Phase 4, create a Twilio Batch Transcription Configuration manually with its status callback set to:

```text
POST https://genius-bat-phone.vercel.app/api/twilio/transcription
```

Set `TWILIO_TRANSCRIPTION_CONFIGURATION_ID` to the returned ID (a string beginning with `voice_transcriptionconfiguration_`). The application submits each completed Twilio Recording SID to Twilio; it does not call Deepgram directly. Configure `RESEND_FROM_EMAIL` with a sender on a verified Resend domain.

## Call history and recordings

Signed-in users can review their call history at `/calls` and open a specific
call at `/calls/[id]`. The browser never receives Twilio recording URLs or
credentials directly; playback is proxied through
`/api/calls/[callId]/recording` after the current user is authenticated and
ownership is confirmed.
