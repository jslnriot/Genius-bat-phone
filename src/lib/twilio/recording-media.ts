import "server-only";

export async function fetchTwilioRecordingMedia(
  recordingSid: string,
  fetcher: typeof fetch = fetch,
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio recording credentials are not configured.");
  }

  const recordingUrl =
    `https://api.twilio.com/2010-04-01/Accounts/` +
    `${encodeURIComponent(accountSid)}/Recordings/` +
    `${encodeURIComponent(recordingSid)}.mp3`;

  return fetcher(recordingUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${accountSid}:${authToken}`,
      ).toString("base64")}`,
    },
  });
}
