import { DashboardV2 } from "@/components/dashboardv2/dashboard-v2";
import type {
  SessionItem,
  SessionStatus,
} from "@/components/dashboardv2/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SessionRow = {
  session_id: number;
  title: string | null;
  status: SessionStatus | null;
  created_at: string | null;
};

type SessionMemberRow = {
  joined_at: string | null;
  sessions: SessionRow | SessionRow[] | null;
};

export default async function DashboardV2Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = profile?.role === "teacher" ? "teacher" : "student";

  let sessions: SessionItem[] = [];
  let error: string | null = null;

  if (role === "teacher") {
    const { data, error: fetchError } = await supabase
      .from("sessions")
      .select("session_id, title, status, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      error = "Unable to load sessions right now.";
    } else {
      sessions = (data ?? []).map((row) => mapSessionRow(row));
    }
  } else {
    const { data, error: fetchError } = await supabase
      .from("session_members")
      .select(
        "joined_at, sessions!inner(session_id, title, status, created_at)",
      )
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (fetchError) {
      error = "Unable to load your sessions right now.";
    } else {
      const deduped = new Map<string, SessionItem>();
      const rows = Array.isArray(data) ? data : [];
      rows.forEach((row: SessionMemberRow) => {
        const session =
          row.sessions && Array.isArray(row.sessions)
            ? row.sessions[0]
            : row.sessions;
        if (!session) return;
        const item = mapSessionRow(session, row.joined_at);
        if (!deduped.has(item.id)) {
          deduped.set(item.id, item);
        }
      });
      sessions = Array.from(deduped.values());
    }
  }

  return (
    <DashboardV2 role={role} initialSessions={sessions} initialError={error} />
  );
}

function mapSessionRow(row: SessionRow, joinedAt?: string | null): SessionItem {
  const fallbackTime = new Date().toISOString();
  const createdAt = row.created_at ?? fallbackTime;
  const lastActive = joinedAt ?? row.created_at ?? fallbackTime;

  return {
    id: row.session_id.toString(),
    title: row.title || "Untitled session",
    status: (row.status ?? "draft") as SessionStatus,
    createdAt,
    lastActive,
  };
}
