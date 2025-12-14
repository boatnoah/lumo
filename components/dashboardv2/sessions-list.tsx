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
import { Separator } from "@/components/ui/separator";
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
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-100",
    border: "border-emerald-100 dark:border-emerald-900/60",
    label: "Live",
  },
  draft: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-100",
    border: "border-amber-100 dark:border-amber-900/60",
    label: "Draft",
  },
  ended: {
    bg: "bg-slate-100 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-100",
    border: "border-slate-200 dark:border-slate-800",
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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="hidden md:block">
        <Table className="[&_th]:bg-muted/60">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%] px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Session
              </TableHead>
              <TableHead className="w-[12%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-[18%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Last active
              </TableHead>
              <TableHead className="w-[18%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                    className="animate-pulse border-b border-border/80"
                  >
                    <TableCell className="px-4 py-4">
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="mt-2 h-3 w-24 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-16 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 rounded bg-muted" />
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
                className="animate-pulse rounded-lg border border-border bg-card p-3"
              >
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="mt-2 h-3 w-24 rounded bg-muted" />
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-5 w-16 rounded bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted" />
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
    <TableRow className="group cursor-pointer border-b border-border/80 transition-colors hover:bg-muted/50">
      <TableCell className="px-4">
        <Link
          href={`/sessions/${session.id}/edit`}
          className="flex flex-col gap-1"
          prefetch={false}
        >
          <span className="text-[15px] font-semibold text-foreground group-hover:underline">
            {session.title || "Untitled session"}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Badge
          className={cn(
            "h-6 rounded-full border px-2 text-xs font-semibold",
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
    <div className="rounded-lg border border-border bg-card p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/sessions/${session.id}/edit`} prefetch={false}>
            <p className="truncate text-[15px] font-semibold text-foreground">
              {session.title || "Untitled session"}
            </p>
          </Link>
        </div>
        <Badge
          className={cn(
            "h-6 rounded-full border px-2 text-xs font-semibold",
            status.bg,
            status.text,
            status.border,
          )}
          variant="outline"
        >
          {status.label}
        </Badge>
      </div>
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Last active
          </span>
          <TimeLabel
            label={session.lastActiveLabel}
            exact={session.lastActiveExact}
          />
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
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
            href={`/sessions/${session.id}/edit`}
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
              className="text-red-600 focus:bg-red-50"
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
      className="text-sm text-muted-foreground"
      title={exact}
      aria-label={`${label}, exact time ${exact}`}
    >
      {label}
    </span>
  );
}
