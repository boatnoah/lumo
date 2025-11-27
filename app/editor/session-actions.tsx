"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type SessionActionsProps = {
  sessionId: string | number;
  initialStatus?: string | null;
};

export default function SessionActions({
  sessionId,
  initialStatus,
}: SessionActionsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(initialStatus ?? "draft");

  const updateStatus = async (nextStatus: "draft" | "live") => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to update session");
      }

      setStatus(nextStatus);
      toast.success(
        nextStatus === "live" ? "Session is live" : "Saved as draft",
      );

      if (nextStatus === "live") {
        router.push(`/sessions/${sessionId}/live`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update session",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={() => updateStatus("draft")}
        disabled={isSaving}
      >
        Save as draft
      </Button>
      <Button onClick={() => updateStatus("live")} disabled={isSaving}>
        {status === "live" ? "Go to live" : "Go live"}
      </Button>
    </div>
  );
}
