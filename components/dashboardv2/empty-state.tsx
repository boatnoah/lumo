import { Button } from "@/components/ui/button";
import type { Role } from "./types";

interface EmptyStateProps {
  role: Role;
  onCreate?: () => void;
}

export function EmptyState({ role, onCreate }: EmptyStateProps) {
  const isTeacher = role === "teacher";

  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-foreground">
      <p className="text-base font-semibold">
        {isTeacher ? "No sessions yet" : "No sessions to show"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {isTeacher
          ? "Create a session to start planning or go live."
          : "You will see sessions you join or are assigned here."}
      </p>
      {isTeacher ? (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            className="h-9 rounded-md border-border bg-background px-4 text-sm font-medium shadow-none hover:bg-muted"
            onClick={onCreate}
          >
            Create session
          </Button>
        </div>
      ) : null}
    </div>
  );
}
