import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoleStep from "./role-step";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, avatar")
    .eq("user_id", user.id)
    .maybeSingle();

  // If profile missing (shouldn’t happen since callback inserts), fall back to this page
  // If already completed, skip onboarding
  if (profile?.role && profile?.avatar) {
    console.log("bruh");
    redirect("/dashboard");
  }

  return <RoleStep hasAvatar={!!profile?.avatar} />;
}
