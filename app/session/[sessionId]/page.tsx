import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import StudentLiveView from "./student-view";

type SessionRow = {
  session_id: number;
  title: string;
  description: string | null;
  join_code: string;
  status: "draft" | "live" | "ended";
  current_prompt: number | null;
};

type PromptRow = {
  prompt_id: number;
  session_id: number;
  slide_index: number;
  kind: "mcq" | "short_text" | "long_text" | "slide";
  content: any;
  is_open: boolean;
  released: boolean;
};

export default async function StudentSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const sessionId = Number(params.sessionId);
  if (!Number.isFinite(sessionId)) {
    redirect("/session");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "student") {
    redirect("/dashboard");
  }

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "session_id, title, description, join_code, status, current_prompt",
    )
    .eq("session_id", sessionId)
    .maybeSingle<SessionRow>();

  if (!session) {
    notFound();
  }

  let prompt: PromptRow | null = null;
  if (session.current_prompt) {
    const { data: promptRow } = await supabase
      .from("prompts")
      .select(
        "prompt_id, session_id, slide_index, kind, content, is_open, released",
      )
      .eq("prompt_id", session.current_prompt)
      .maybeSingle<PromptRow>();
    prompt = promptRow ?? null;
  }

  return (
    <StudentLiveView
      session={{
        session_id: session.session_id,
        title: session.title,
        description: session.description ?? "",
        join_code: session.join_code,
        status: session.status,
        current_prompt: session.current_prompt,
      }}
      user={{ id: user.id, name: profile?.display_name || "You" }}
      initialPrompt={prompt}
    />
  );
}
