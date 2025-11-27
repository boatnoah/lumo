import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

import type { Profile } from "./types";
import SessionCard from "./session-card";

export const dynamic = "force-dynamic";

type SessionRow = {
  session_id: number;
  title: string | null;
  status: string | null;
  join_code: string | null;
  created_at: string | null;
  joined_at?: string | null;
};

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, avatar")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  if (profileError) {
    redirect("/profile");
  }

  const sidebarUser = {
    name: profile?.display_name || "User",
    role: profile?.role || "",
    avatar: profile?.avatar || "",
  };

  const isStudent = profile?.role === "student";

  let sessionRows: SessionRow[] = [];

  if (isStudent) {
    const { data: joinedSessions, error: joinedError } = await supabase
      .from("session_members")
      .select(
        "joined_at, session:sessions(session_id, title, status, join_code, created_at)",
      )
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (!joinedError && Array.isArray(joinedSessions)) {
      sessionRows = [];
      for (const row of joinedSessions) {
        const rawSession = (row as Record<string, unknown>).session;
        // Supabase returns an object for the joined session; skip arrays/nulls.
        if (!rawSession || Array.isArray(rawSession)) continue;

        const session = rawSession as SessionRow;
        sessionRows.push({
          ...session,
          joined_at:
            typeof (row as Record<string, unknown>).joined_at === "string"
              ? ((row as Record<string, unknown>).joined_at as string)
              : null,
        });
      }
    }
  } else {
    const { data: ownedSessions } = await supabase
      .from("sessions")
      .select("session_id, title, status, join_code, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    sessionRows = (ownedSessions ?? []) as SessionRow[];
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <div className="flex flex-1 flex-col px-4 py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                {isStudent ? "Joined sessions" : "Your sessions"}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
            </div>
            <Button variant="outline" asChild>
              <a href="/profile">Edit profile</a>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessionRows.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  {isStudent
                    ? "No joined sessions yet. Join a session with your code to see it here."
                    : "No sessions yet. Create one from the editor to see it listed here."}
                </CardContent>
              </Card>
            ) : (
              sessionRows.map((session) => (
                <SessionCard
                  key={session.session_id}
                  session={session}
                  canManage={!isStudent}
                />
              ))
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
