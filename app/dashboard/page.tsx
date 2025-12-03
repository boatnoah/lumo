import { AppSidebar } from "@/components/app-sidebar";
import {
  DashboardSessions,
  type SessionSummary,
} from "@/components/dashboard-sessions";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Profile } from "./types";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, avatar")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  if (error) {
    redirect("/profile");
  }

  const isTeacher = profile?.role === "teacher";

  let teacherSessions: SessionSummary[] = [];

  if (isTeacher) {
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("session_id, title, description")
      .eq("owner_id", user.id)
      .order("session_id", { ascending: false });

    teacherSessions = sessionsData ?? [];
  }

  const sidebarUser = {
    name: profile?.display_name || "User",
    role: profile?.role || "",
    avatar: profile?.avatar || "",
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Sessions</h1>
              <p className="text-sm text-muted-foreground">
                {isTeacher
                  ? "All sessions you have created."
                  : "Joined sessions will appear here."}
              </p>
            </div>
            <DashboardSessions
              role={profile?.role || ""}
              sessions={teacherSessions}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
