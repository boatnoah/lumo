import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

import PromptManager from "./prompt-manager";
import type { PromptRecord } from "./types";
import SessionActions from "./session-actions";

type EditorPageProps = {
  searchParams?: Promise<{
    sessionId?: string;
  }>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const sessionIdParam = resolvedParams?.sessionId;

  if (!sessionIdParam) {
    redirect("/dashboard");
  }

  const sessionIdFilter = Number.isNaN(Number(sessionIdParam))
    ? sessionIdParam
    : Number(sessionIdParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("session_id, title, status, join_code")
    .eq("session_id", sessionIdFilter)
    .maybeSingle();

  if (!session) {
    redirect("/dashboard");
  }

  const { data: promptRows } = await supabase
    .from("prompts")
    .select("prompt_id, session_id, slide_index, kind, content, created_at")
    .eq("session_id", sessionIdFilter)
    .order("slide_index", { ascending: true });

  const prompts = (promptRows ?? []) as PromptRecord[];

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase text-muted-foreground">Prompt builder</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {session.title || "Untitled session"}
          </h1>
          <Badge variant="secondary" className="capitalize">
            {session.status ?? "draft"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Create prompts, drag to reorder them, and remove the ones you no longer
          need.
        </p>
        <p className="text-xs text-muted-foreground">
          Session #{session.session_id} · Join code {session.join_code ?? "------"}
        </p>
        <SessionActions
          sessionId={session.session_id}
          initialStatus={session.status}
        />
      </header>

      <PromptManager sessionId={session.session_id} initialPrompts={prompts} />
    </div>
  );
}
