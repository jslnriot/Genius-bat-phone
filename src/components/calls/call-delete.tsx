"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { deleteCall } from "@/app/calls/actions";

type CallDeleteProps = {
  callId: string;
};

const destructiveOutlineClassName =
  "min-h-11 w-full border border-error/30 bg-white hover:bg-error/10";

export function CallDelete({ callId }: CallDeleteProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConfirmation() {
    setError(null);
    setIsConfirming(true);
  }

  function closeConfirmation() {
    if (isDeleting) return;
    setError(null);
    setIsConfirming(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const result = await deleteCall(callId);

    if (!result.success) {
      setError(result.message);
    }
    setIsDeleting(false);
  }

  return (
    <section
      aria-labelledby="delete-call-heading"
      className="mt-8 space-y-4 border-t border-border pt-8"
    >
      {!isConfirming ? (
        <Tooltip label="Delete this call from your history" className="w-full">
          <Button
            type="button"
            variant="destructive"
            className={destructiveOutlineClassName}
            onClick={openConfirmation}
          >
            Delete call
          </Button>
        </Tooltip>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2
              id="delete-call-heading"
              className="text-base font-semibold text-primary"
            >
              Delete this call?
            </h2>
            <p className="text-sm text-secondary-text">
              This will remove the call and its transcript from your Bat Phone
              history. This action cannot be undone.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-error text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Tooltip label="Cancel deletion" className="w-full">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full"
                disabled={isDeleting}
                onClick={closeConfirmation}
              >
                Cancel
              </Button>
            </Tooltip>
            <Tooltip
              label="Permanently delete this call"
              className="w-full"
            >
              <Button
                type="button"
                variant="destructive"
                className={destructiveOutlineClassName}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "Deleting…" : "Delete call"}
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </section>
  );
}
