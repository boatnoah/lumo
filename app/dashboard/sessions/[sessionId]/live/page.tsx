import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import LiveTeacherView from "./teacher-view";

type PromptRow = {
  prompt_id: number;
  slide_index: number;
  kind: "mcq" | "short_text" | "long_text" | "slide";
  content: unknown;
  is_open: boolean;
  released: boolean;
};

export default async function LiveSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const sessionId = Number(params.sessionId);
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
    redirect("/dashboard");
  }

  const { data: prompts } = await supabase
    .from("prompts")
    .select(
      "prompt_id, slide_index, kind, content, is_open, released, created_by",
    )
    .eq("session_id", sessionId)
    .order("slide_index");

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
      prompts={(prompts as PromptRow[]) ?? []}
    />
  );
}
