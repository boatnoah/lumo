import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1) Confirm session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2) Fetch the user's profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) redirect("/profile-building");

  // 3) Optionally guard: redirect if onboarding incomplete
  if (!profile.role || profile.role === "pending" || !profile.avatar)
    redirect("/profile");

  // 4) Render all profile info
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="rounded-2xl border p-6 flex flex-col gap-4">
        {/* Avatar */}
        {profile.avatar && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover shadow"
            />
          </div>
        )}

        <div>
          <p className="text-lg font-semibold">{profile.display_name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Role:</div>
          <div>{profile.role}</div>

          <div className="text-muted-foreground">User ID:</div>
          <div className="break-all">{profile.user_id}</div>
        </div>
      </div>
    </main>
  );
}
