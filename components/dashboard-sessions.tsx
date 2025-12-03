import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SessionSummary = {
  session_id: number;
  title: string | null;
  description: string | null;
};

export function DashboardSessions({
  role,
  sessions,
}: {
  role: string;
  sessions: SessionSummary[];
}) {
  const isTeacher = role === "teacher";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>
          {isTeacher
            ? "Click a session to keep editing."
            : "Your joined sessions will show up here soon."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isTeacher ? (
          sessions.length ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="rounded-lg border px-4 py-3 transition hover:border-primary hover:bg-muted"
                >
                  <Link
                    href={`/dashboard/sessions/${session.session_id}/edit`}
                    className="block"
                  >
                    <p className="font-semibold">
                      {session.title || "Untitled session"}
                    </p>
                    {session.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {session.description}
                      </p>
                    ) : null}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Link
                      href={`/dashboard/sessions/${session.session_id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Link
                      href={`/dashboard/sessions/${session.session_id}/live`}
                      className="text-primary hover:underline"
                    >
                      Go live
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No sessions yet. Use “Create Session” to start.
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Space reserved for your sessions. Nothing to show yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
