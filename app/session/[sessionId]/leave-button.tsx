"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function LeaveSessionButton({
  sessionId,
}: {
  sessionId: number;
}) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLeave = async () => {
    setError(null);
    setIsLeaving(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/leave`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload?.error || "Could not leave right now.");
        setIsLeaving(false);
        return;
      }

      router.replace("/session?left=1");
    } catch (leaveError) {
      console.error(leaveError);
      setError("Could not leave right now.");
      setIsLeaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onLeave} disabled={isLeaving}>
        {isLeaving ? "Leaving..." : "Leave session"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
