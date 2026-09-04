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

export async function deleteTwilioRecording(
  recordingSid: string,
  fetcher: typeof fetch = fetch,
): Promise<{ success: true } | { success: false; status: number }> {
  const { accountSid } = getTwilioAccountCredentials();
  const authorization = getTwilioBasicAuthHeader();

  const recordingUrl =
    `https://api.twilio.com/2010-04-01/Accounts/` +
    `${encodeURIComponent(accountSid)}/Recordings/` +
    `${encodeURIComponent(recordingSid)}`;

  const response = await fetcher(recordingUrl, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
    },
  });

  if (response.status === 204 || response.status === 404) {
    return { success: true };
  }

  return { success: false, status: response.status };
}
