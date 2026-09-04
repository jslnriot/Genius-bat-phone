import "server-only";

export function getTwilioAuthToken() {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is not configured.");
  }

  return authToken;
}

export function getTwilioPhoneNumber() {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error("TWILIO_PHONE_NUMBER is not configured.");
  }

  return phoneNumber;
}

export function getTwilioAccountCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio recording credentials are not configured.");
  }

  return { accountSid, authToken };
}

export function getTwilioBasicAuthHeader() {
  const { accountSid, authToken } = getTwilioAccountCredentials();
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export function getTwilioTranscriptionConfiguration() {
  const configurationId =
    process.env.TWILIO_TRANSCRIPTION_CONFIGURATION_ID;
  if (!configurationId) {
    throw new Error("Twilio transcription environment is not configured.");
  }

  return {
    authorization: getTwilioBasicAuthHeader(),
    configurationId,
  };
}
