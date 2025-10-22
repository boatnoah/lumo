import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OneTap from "@/components/OneTapComponent";
import GoogleAuthServer from "@/components/GoogleAuthServer"; // manual fallback button

export default async function LoginPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>
      <OneTap />
      <GoogleAuthServer />
    </main>
  );
}