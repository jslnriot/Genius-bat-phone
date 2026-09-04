import "server-only";

import {
  getTwilioAccountCredentials,
  getTwilioBasicAuthHeader,
} from "@/lib/twilio/environment";

export async function fetchTwilioRecordingMedia(
  recordingSid: string,
  fetcher: typeof fetch = fetch,
) {
  const { accountSid } = getTwilioAccountCredentials();
  const authorization = getTwilioBasicAuthHeader();

  const recordingUrl =
    `https://api.twilio.com/2010-04-01/Accounts/` +
    `${encodeURIComponent(accountSid)}/Recordings/` +
    `${encodeURIComponent(recordingSid)}.mp3`;

  return fetcher(recordingUrl, {
    headers: {
      Authorization: authorization,
    },
  });
}
