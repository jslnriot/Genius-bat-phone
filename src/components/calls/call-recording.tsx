"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CallRecordingProps = {
  callId: string;
};

export function CallRecording({ callId }: CallRecordingProps) {
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const recordingHref = `/api/calls/${encodeURIComponent(callId)}/recording`;

  return (
    <div className="flex flex-col gap-4">
      {playbackFailed ? (
        <p role="alert" className="text-sm leading-5 text-secondary-text">
          The recording could not be played. You can still download it.
        </p>
      ) : (
        <audio
          aria-label="Call recording"
          controls
          preload="metadata"
          className="block h-14 w-full max-w-full"
          src={recordingHref}
          onError={() => setPlaybackFailed(true)}
        >
          Your browser does not support audio playback.
        </audio>
      )}
      <Tooltip label="Download recording" className="w-full">
        <a
          href={`${recordingHref}?download=1`}
          className={cn(buttonVariants({ variant: "secondary" }), "w-full gap-2")}
        >
          <Download aria-hidden="true" size={20} />
          Download recording
        </a>
      </Tooltip>
    </div>
  );
}
