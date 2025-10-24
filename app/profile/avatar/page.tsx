import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarStep from "./avatar-step";

export default async function AvatarPage() {
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

  // Must pick role first
  if (!profile?.role) {
    console.log("bruh");
    redirect("/profile");
  }
  // If already finished, skip
  if (profile?.role && profile?.avatar) redirect("/dashboard");

  return <AvatarStep />;
}
