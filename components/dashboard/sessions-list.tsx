import Link from "next/link";
import { ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import type { DecoratedSession, Role } from "./types";

const statusStyles: Record<
  DecoratedSession["status"],
  { bg: string; text: string; border: string; label: string }
> = {
  live: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    label: "Live",
  },
  draft: {
    bg: "bg-warning/10",
    text: "text-warning-foreground",
    border: "border-warning/20",
    label: "Draft",
  },
  ended: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    label: "Ended",
  },
};

interface SessionsListProps {
  role: Role;
  sessions: DecoratedSession[];
  isLoading?: boolean;
  onDelete: (session: DecoratedSession) => void;
  onCreate?: () => void;
}

export function SessionsList({
  role,
  sessions,
  isLoading = false,
  onDelete,
  onCreate,
}: SessionsListProps) {
  const isTeacher = role === "teacher";

  if (!sessions.length && !isLoading) {
    return <EmptyState role={role} onCreate={onCreate} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="w-[40%] px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Session
              </TableHead>
              <TableHead className="w-[12%] py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Status
              </TableHead>
              <TableHead className="w-[18%] py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Last active
              </TableHead>
              <TableHead className="w-[18%] py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Created
              </TableHead>
              <TableHead className="w-[12%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="animate-pulse border-b border-border/40"
                  >
                    <TableCell className="px-4 py-4">
                      <div className="h-4 w-48 rounded bg-muted/70" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-14 rounded-full bg-muted/70" />
                    </TableCell>
                    <TableCell>
                      <div className="h-3.5 w-20 rounded bg-muted/70" />
                    </TableCell>
                    <TableCell>
                      <div className="h-3.5 w-20 rounded bg-muted/70" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              : sessions.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      isTeacher={isTeacher}
                      onDelete={onDelete}
                    />
                  ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-mobile-${index}`}
                className="animate-pulse rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="h-4 w-40 rounded bg-muted/70" />
                <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                  <div className="h-5 w-14 rounded-full bg-muted/70" />
                  <div className="h-3.5 w-16 rounded bg-muted/70" />
                </div>
              </div>
            ))
          : sessions.map((session) => (
              <MobileSessionCard
                key={session.id}
                session={session}
                isTeacher={isTeacher}
                onDelete={onDelete}
              />
            ))}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  isTeacher,
  onDelete,
}: {
  session: DecoratedSession;
  isTeacher: boolean;
  onDelete: (session: DecoratedSession) => void;
}) {
  const status = statusStyles[session.status];

  return (
    <TableRow className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30">
      <TableCell className="px-4 py-3.5">
        <Link
          href={isTeacher ? `/sessions/${session.id}/edit` : `/session/${session.id}`}
          className="block"
          prefetch={false}
        >
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            {session.title || "Untitled session"}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Badge
          className={cn(
            "h-[22px] rounded-full border px-2 text-[11px] font-medium",
            status.bg,
            status.text,
            status.border,
          )}
          variant="outline"
        >
          {status.label}
        </Badge>
      </TableCell>
      <TableCell>
        <TimeLabel
          label={session.lastActiveLabel}
          exact={session.lastActiveExact}
        />
      </TableCell>
      <TableCell>
        <TimeLabel label={session.createdLabel} exact={session.createdExact} />
      </TableCell>
      <TableCell className="pr-4 text-right">
        <RowMenu session={session} isTeacher={isTeacher} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

function MobileSessionCard({
  session,
  isTeacher,
  onDelete,
}: {
  session: DecoratedSession;
  isTeacher: boolean;
  onDelete: (session: DecoratedSession) => void;
}) {
  const status = statusStyles[session.status];

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={isTeacher ? `/sessions/${session.id}/edit` : `/session/${session.id}`} prefetch={false}>
            <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {session.title || "Untitled session"}
            </p>
          </Link>
        </div>
        <Badge
          className={cn(
            "h-[22px] shrink-0 rounded-full border px-2 text-[11px] font-medium",
            status.bg,
            status.text,
            status.border,
          )}
          variant="outline"
        >
          {status.label}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Last active
          </span>
          <TimeLabel
            label={session.lastActiveLabel}
            exact={session.lastActiveExact}
          />
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Created
          </span>
          <TimeLabel
            label={session.createdLabel}
            exact={session.createdExact}
          />
        </div>
        <RowMenu
          session={session}
          isTeacher={isTeacher}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function RowMenu({
  session,
  isTeacher,
  onDelete,
}: {
  session: DecoratedSession;
  isTeacher: boolean;
  onDelete: (session: DecoratedSession) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted/70"
          aria-label="Open session menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border-border">
        <DropdownMenuItem asChild>
          <Link
            href={isTeacher ? `/sessions/${session.id}/edit` : `/session/${session.id}`}
            className="flex items-center gap-2 text-foreground"
            prefetch={false}
          >
            <ExternalLink className="h-4 w-4" />
            Open session
          </Link>
        </DropdownMenuItem>
        {isTeacher ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onDelete(session);
              }}
              className="text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TimeLabel({ label, exact }: { label: string; exact: string }) {
  return (
    <span
      className="text-[13px] text-muted-foreground/70"
      title={exact}
      aria-label={`${label}, exact time ${exact}`}
    >
      {label}
    </span>
  );
}
