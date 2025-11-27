"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionCardProps = {
  session: {
    session_id: number;
    title: string | null;
    status: string | null;
    join_code: string | null;
    created_at?: string | null;
    joined_at?: string | null;
  };
  canManage?: boolean;
};

export default function SessionCard({ session, canManage = true }: SessionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this session and its prompts? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sessions/${session.session_id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete session");
      }

      toast.success("Session deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete session",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const timestampLabel = session.joined_at ? "Joined" : "Created";
  const timestampValue = session.joined_at ?? session.created_at ?? null;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {session.title || "Untitled session"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Session #{session.session_id} · Join code{" "}
            {session.join_code ?? "------"}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {session.status ?? "draft"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {timestampLabel}{" "}
          {timestampValue ? new Date(timestampValue).toLocaleString() : "recently"}
        </p>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/editor?sessionId=${session.session_id}`}>
                Edit prompts
              </Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={`/sessions/${session.session_id}/live`}>
              Open live view
            </Link>
          </Button>
          {canManage && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
