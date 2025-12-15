import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { PromptContent, PromptKind } from "@/types/prompts";
import LiveTeacherView from "./teacher-view";

type PromptRow = {
  prompt_id: number;
  slide_index: number;
  kind: PromptKind;
  content: PromptContent;
  is_open: boolean;
  released: boolean;
};

export default async function LiveSessionPage({
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
    .select(
      "session_id, owner_id, title, description, status, join_code, current_prompt",
    )
    .eq("session_id", sessionId)
    .maybeSingle();

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <LiveTeacherView
      session={{
        session_id: session.session_id,
        title: session.title,
        description: session.description ?? "",
        status: session.status,
        join_code: session.join_code,
        current_prompt: session.current_prompt,
      }}
      user={{
        id: user.id,
        name: profile?.display_name || "Teacher",
        avatar: profile?.avatar || null,
      }}
      prompts={
        (prompts?.map((prompt) => ({
          ...prompt,
          content: (prompt as { content: PromptContent }).content,
        })) as PromptRow[] | undefined) ?? []
      }
    />
  );
}
