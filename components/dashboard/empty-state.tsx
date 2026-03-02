import { Button } from "@/components/ui/button";
import type { Role } from "./types";

interface EmptyStateProps {
  role: Role;
  onCreate?: () => void;
}

export function EmptyState({ role, onCreate }: EmptyStateProps) {
  const isTeacher = role === "teacher";

  return (
    <div className="rounded-xl border border-dashed border-border/50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">
        {isTeacher ? "No sessions yet" : "No sessions to show"}
      </p>
      <p className="mt-1.5 text-[13px] text-muted-foreground/70">
        {isTeacher
          ? "Create a session to start planning or go live."
          : "You will see sessions you join or are assigned here."}
      </p>
      {isTeacher ? (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            className="h-9 rounded-lg border-border/60 bg-background px-4 text-sm font-medium shadow-none hover:bg-muted"
            onClick={onCreate}
          >
            Create session
          </Button>
        </div>
      ) : null}
    </div>
  );
}
