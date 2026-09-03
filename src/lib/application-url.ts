import "server-only";

export function applicationUrl(path: string) {
  const hostname =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const origin = hostname ? `https://${hostname}` : "http://localhost:3000";

  return new URL(path, origin).toString();
}

export function callRecordingUrl(callId: string) {
  return applicationUrl(`/api/calls/${encodeURIComponent(callId)}/recording`);
}

export function callDetailUrl(callId: string) {
  return applicationUrl(`/calls/${encodeURIComponent(callId)}`);
}
