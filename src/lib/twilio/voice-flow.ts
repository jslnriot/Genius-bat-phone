import twilio from "twilio";
import { matchContactByName } from "@/lib/twilio/contact-matching";
import { logTwilioEvent } from "@/lib/twilio/logging";
import type {
  DialableCall,
  TelephonyRepository,
} from "@/lib/twilio/telephony-repository";

const { VoiceResponse } = twilio.twiml;
const MAX_DTMF_CONTACTS = 9;

function finishWithMessage(message: string) {
  const response = new VoiceResponse();
  response.say(message);
  response.hangup();
  return response.toString();
}

function contactMenu(contacts: { name: string }[]) {
  const choices = contacts
    .slice(0, MAX_DTMF_CONTACTS)
    .map((contact, index) => `press ${index + 1} for ${contact.name}`)
    .join(", ");

  return choices ? ` You can also ${choices}.` : "";
}

function gatherForContacts(
  contacts: { name: string }[],
  attempt: 0 | 1,
) {
  const response = new VoiceResponse();
  const gather = response.gather({
    action: `/api/twilio/resolve-contact?attempt=${attempt}`,
    actionOnEmptyResult: true,
    hints: contacts
      .slice(0, MAX_DTMF_CONTACTS)
      .map((contact) => contact.name)
      .join(", "),
    input: ["speech", "dtmf"],
    method: "POST",
    numDigits: 1,
    speechTimeout: "auto",
    timeout: 5,
  });

  const prompt =
    attempt === 0
      ? "Who would you like to call?"
      : "Sorry, I could not find that contact. Please say the name again.";
  gather.say(`${prompt}${contactMenu(contacts)}`);

  return response.toString();
}

export function twimlResponse(xml: string, status = 200) {
  return new Response(xml, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export function invalidSignatureResponse() {
  return new Response("Invalid Twilio signature.", { status: 403 });
}

export async function incomingCallTwiml(
  from: string,
  repository: TelephonyRepository,
) {
  const profile = await repository.findProfileByPhone(from);
  if (!profile) {
    logTwilioEvent("info", "twilio.unknown_caller_rejected");
    return finishWithMessage(
      "This phone number is not registered with Bat Phone.",
    );
  }

  const contacts = await repository.listContacts(profile.id);
  if (contacts.length === 0) {
    return finishWithMessage(
      "You do not have any contacts configured. Goodbye.",
    );
  }

  return gatherForContacts(contacts, 0);
}

type ResolveContactInput = {
  attempt: 0 | 1;
  callSid: string;
  digits?: string;
  from: string;
  speechConfidence?: number;
  speechResult?: string;
  twilioPhoneNumber: string;
};

function contactFromDigits<T>(digits: string | undefined, contacts: T[]) {
  if (!digits || !/^[1-9]$/.test(digits)) return null;
  return contacts[Number(digits) - 1] ?? null;
}

function dialTwiml(call: DialableCall, callerId: string) {
  const response = new VoiceResponse();
  response.say(`Calling ${call.contact_name_snapshot}.`);
  response.dial(
    {
      action: "/api/twilio/dial-complete",
      answerOnBridge: true,
      callerId,
      method: "POST",
      record: "record-from-answer-dual",
      recordingStatusCallback: "/api/twilio/recording",
      recordingStatusCallbackEvent: ["completed"],
      recordingStatusCallbackMethod: "POST",
    },
    call.destination_number,
  );
  return response.toString();
}

export async function resolveContactTwiml(
  input: ResolveContactInput,
  repository: TelephonyRepository,
) {
  const profile = await repository.findProfileByPhone(input.from);
  if (!profile) {
    logTwilioEvent("info", "twilio.unknown_caller_rejected", {
      callSid: input.callSid,
    });
    return finishWithMessage(
      "This phone number is not registered with Bat Phone.",
    );
  }

  const contacts = await repository.listContacts(profile.id);
  if (contacts.length === 0) {
    return finishWithMessage(
      "You do not have any contacts configured. Goodbye.",
    );
  }

  let contact = contactFromDigits(input.digits, contacts);

  if (!contact && input.speechResult) {
    const match = matchContactByName(input.speechResult, contacts);
    const lowConfidenceFuzzyMatch =
      match.status === "matched" &&
      match.method === "fuzzy" &&
      input.speechConfidence !== undefined &&
      input.speechConfidence < 0.75;

    if (match.status === "matched" && !lowConfidenceFuzzyMatch) {
      contact = match.contact;
    }
  }

  if (!contact) {
    logTwilioEvent("info", "twilio.contact_unresolved", {
      attempt: input.attempt,
      callSid: input.callSid,
      outcome: input.attempt === 0 ? "retry" : "hangup",
    });
    return input.attempt === 0
      ? gatherForContacts(contacts, 1)
      : finishWithMessage(
          "I could not resolve that contact. Please update your contacts and try again. Goodbye.",
        );
  }

  const call = await repository.createCallBeforeDial({
    contact_id: contact.id,
    contact_name_snapshot: contact.name,
    destination_number: contact.phone_number,
    start_time: new Date().toISOString(),
    status: "in_progress",
    twilio_call_sid: input.callSid,
    user_id: profile.id,
  });

  return dialTwiml(call, input.twilioPhoneNumber);
}

export function dialCompleteTwiml(status: string) {
  const messageByStatus: Record<string, string> = {
    busy: "That contact is busy. Please try again later.",
    canceled: "The call was canceled.",
    completed: "Your call has ended. Goodbye.",
    failed: "The call could not be completed.",
    "no-answer": "That contact did not answer. Please try again later.",
  };

  return finishWithMessage(
    messageByStatus[status] ?? "The call has ended. Goodbye.",
  );
}

export function databaseFailureTwiml() {
  return finishWithMessage(
    "Bat Phone could not complete your request. Please try again later.",
  );
}
