import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type LiveSessionPageProps = {
  params: { sessionId: string };
};

export default async function LiveSessionPage({
  params,
}: LiveSessionPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const sessionIdParam = params.sessionId;
  const sessionIdFilter = Number.isNaN(Number(sessionIdParam))
    ? sessionIdParam
    : Number(sessionIdParam);

  const { data: session } = await supabase
    .from("sessions")
    .select("session_id, owner_id, status, title")
    .eq("session_id", sessionIdFilter)
    .maybeSingle();

  if (!session || session.owner_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-xl rounded-2xl border bg-background p-8 shadow-sm">
        <p className="text-sm uppercase text-muted-foreground">Live session</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {session.title || "Session"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This space is ready for the live experience. Build the student view
          here.
        </p>
      </div>
    </div>
  );
}
