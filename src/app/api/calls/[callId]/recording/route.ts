import { fetchTwilioRecordingMedia } from "@/lib/twilio/recording-media";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ callId: string }> },
) {
  // Proxy recordings through Bat Phone so the browser never needs Twilio media
  // URLs or account credentials directly.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Authentication required.", { status: 401 });
  }

  const { callId } = await params;
  const { data: call, error } = await supabase
    .from("calls")
    .select("recording_sid")
    .eq("id", callId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      JSON.stringify({
        event: "recording.call_lookup_failed",
        callId,
        userId: user.id,
      }),
    );
    return new Response("Recording unavailable.", { status: 500 });
  }

  // Return the same response for nonexistent and non-owned calls.
  if (!call?.recording_sid) {
    return new Response("Recording not found.", { status: 404 });
  }

  try {
    const recording = await fetchTwilioRecordingMedia(call.recording_sid);
    if (!recording.ok || !recording.body) {
      console.error(
        JSON.stringify({
          event: "recording.twilio_fetch_failed",
          callId,
          recordingSid: call.recording_sid,
          status: recording.status,
        }),
      );
      return new Response("Recording unavailable.", {
        status: recording.status === 404 ? 404 : 502,
      });
    }

    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="bat-phone-${callId}.mp3"`,
      "Content-Type": "audio/mpeg",
    });
    const contentLength = recording.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(recording.body, { headers });
  } catch {
    console.error(
      JSON.stringify({
        event: "recording.twilio_fetch_failed",
        callId,
        recordingSid: call.recording_sid,
      }),
    );
    return new Response("Recording unavailable.", { status: 502 });
  }
}
