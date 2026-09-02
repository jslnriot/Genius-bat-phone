import "server-only";

type LogContext = {
  callSid?: string;
  [key: string]: unknown;
};

function serializeError(error: unknown) {
  return error instanceof Error
    ? { message: error.message, name: error.name }
    : { message: "Unknown error" };
}

export function logTwilioEvent(
  level: "info" | "error",
  event: string,
  context: LogContext = {},
  error?: unknown,
) {
  const entry = JSON.stringify({
    event,
    ...context,
    ...(error === undefined ? {} : { error: serializeError(error) }),
  });

  if (level === "error") {
    console.error(entry);
  } else {
    console.info(entry);
  }
}
