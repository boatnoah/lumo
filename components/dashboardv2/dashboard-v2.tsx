"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SessionsList } from "./sessions-list";
import type {
  DecoratedSession,
  Role,
  SessionItem,
  SessionStatus,
} from "./types";

const statusFilterOptions: (SessionStatus | "all")[] = [
  "all",
  "live",
  "draft",
  "ended",
];

type SortOption = "recent" | "created";

export function DashboardV2({
  role,
  initialSessions = [],
  initialError,
}: {
  role: Role;
  initialSessions?: SessionItem[];
  initialError?: string | null;
}) {
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DecoratedSession | null>(
    null,
  );
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const filteredSessions = useMemo<DecoratedSession[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const list = sessions.filter((session) => {
      const matchesSearch =
        !normalizedSearch ||
        session.title.toLowerCase().includes(normalizedSearch) ||
        session.id.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ? true : session.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted.map((session) => decorateSession(session));
  }, [sessions, search, sortBy, statusFilter]);

  const handleCreateSession = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (role !== "teacher") return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() || undefined }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        const message = body?.error || "Unable to create session.";
        setError(message);
        toast.error("Could not create session", { description: message });
        return;
      }

      const data = (await response.json()) as {
        session: ApiSession;
      };

      const payload = mapApiSession(data.session, newTitle.trim());

      setSessions((prev) => [payload, ...prev]);
      setNewTitle("");
      setCreateOpen(false);
      toast.success("Session created", { description: payload.title });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create session.";
      setError(message);
      toast.error("Could not create session", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (role !== "teacher") return;
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/sessions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        const message = body?.error || "Unable to delete session.";
        toast.error("Delete failed", { description: message });
        return;
      }

      setSessions((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success("Session deleted", { description: deleteTarget.title });
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete session.";
      toast.error("Delete failed", { description: message });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-8 md:pt-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dashboard
            </p>
            <h1 className="text-[28px] font-semibold text-foreground">
              Sessions
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage or review every session in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {role === "teacher" ? "Teacher view" : "Student view"}
            </span>
            {role === "teacher" ? (
              <Button
                onClick={() => setCreateOpen(true)}
                className="h-10 rounded-md border border-border bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition hover:opacity-90"
                disabled={submitting}
              >
                <Plus className="h-4 w-4" />
                New session
              </Button>
            ) : (
              <Button
                asChild
                className="h-10 rounded-md border border-border bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition hover:opacity-90"
              >
                <Link href="/session">
                  <Plus className="h-4 w-4" />
                  Join session
                </Link>
              </Button>
            )}
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-border bg-card/90 shadow-sm">
          <div className="border-b border-border px-4 py-4 md:px-6">
            <Filters
              search={search}
              onSearch={setSearch}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              sortBy={sortBy}
              onSortBy={setSortBy}
            />
          </div>
          <div className="p-3 md:p-4">
            {error ? (
              <ErrorBanner message={error} />
            ) : (
              <SessionsList
                role={role}
                sessions={filteredSessions}
                onDelete={(session) => setDeleteTarget(session)}
                onCreate={
                  role === "teacher" ? () => setCreateOpen(true) : undefined
                }
              />
            )}
          </div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create session</DialogTitle>
            <DialogDescription>
              Add a title to keep things organized. You can update it later.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateSession}>
            <div className="space-y-2">
              <Label htmlFor="session-title">Title</Label>
              <Input
                id="session-title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Untitled session"
                className="h-10 rounded-md border-border bg-background text-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Draft status by default. Move to live when you are ready.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-foreground text-background hover:opacity-90"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete session?</DialogTitle>
            <DialogDescription>
              This removes the session from your workspace. Students will no
              longer see it in their list.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p className="font-semibold">{deleteTarget?.title}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSession}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Filters({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  sortBy,
  onSortBy,
}: {
  search: string;
  onSearch: (value: string) => void;
  statusFilter: SessionStatus | "all";
  onStatusFilter: (value: SessionStatus | "all") => void;
  sortBy: SortOption;
  onSortBy: (value: SortOption) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by title or ID"
            className="h-10 w-full rounded-md border-border bg-background pl-10 text-sm text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)] focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search sessions"
          />
        </div>
        <Separator orientation="vertical" className="hidden h-6 md:block" />
        <div className="flex items-center gap-1 rounded-md bg-muted/60 p-1">
          {statusFilterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStatusFilter(option)}
              className={cn(
                "rounded-md px-3 py-2 text-xs font-semibold capitalize transition",
                option === statusFilter
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={option === statusFilter}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={sortBy}
          onValueChange={(value) => onSortBy(value as SortOption)}
        >
          <SelectTrigger className="h-10 w-[200px] rounded-md border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-ring">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="border-border">
            <SelectItem value="recent" className="text-foreground">
              Sort by last active
            </SelectItem>
            <SelectItem value="created" className="text-foreground">
              Sort by created
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

type ApiSession = {
  session_id: number;
  title: string | null;
  status: SessionStatus | null;
  created_at?: string | null;
};

function mapApiSession(row: ApiSession, overrideTitle?: string): SessionItem {
  const fallbackTime = new Date().toISOString();
  const createdAt = row.created_at ?? fallbackTime;
  const lastActive = createdAt;

  return {
    id: row.session_id.toString(),
    title: overrideTitle || row.title || "Untitled session",
    status: (row.status ?? "draft") as SessionStatus,
    createdAt,
    lastActive,
  };
}

function decorateSession(session: SessionItem): DecoratedSession {
  return {
    ...session,
    lastActiveLabel: formatRelativeTime(session.lastActive),
    lastActiveExact: formatExactDate(session.lastActive),
    createdLabel: formatRelativeTime(session.createdAt),
    createdExact: formatExactDate(session.createdAt),
  };
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.round(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`;
  return `${Math.round(diffMs / day)}d ago`;
}

function formatExactDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
