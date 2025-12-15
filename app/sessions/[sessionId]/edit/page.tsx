import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

import SessionBuilder from "./session-builder";

type PromptRow = {
  prompt_id: number;
  slide_index: number;
  kind: "mcq" | "short_text" | "long_text" | "slide";
  content: unknown;
  is_open: boolean;
  released: boolean;
  created_by: string;
};

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId: sessionIdParam } = await params;
  const sessionId = Number(sessionIdParam);
  if (!Number.isFinite(sessionId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("session_id, title, description, owner_id")
    .eq("session_id", sessionId)
    .single();

  if (!session) {
    notFound();
  }

  if (session.owner_id !== user.id) {
    redirect("/dashboardv2");
  }

  const { data: prompts } = await supabase
    .from("prompts")
    .select(
      "prompt_id, slide_index, kind, content, is_open, released, created_by",
    )
    .eq("session_id", sessionId)
    .order("slide_index");

  return (
    <SessionBuilder
      sessionId={session.session_id}
      sessionTitle={session.title}
      sessionDescription={session.description || ""}
      userId={user.id}
      initialPrompts={(prompts as PromptRow[]) ?? []}
    />
  );
}
