import { createClient } from "@/lib/supabase/server";

export default async function EditSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const supabase = await createClient();
  const sessionId = Number(params.sessionId);

  // needs major refactoring
  const [{ data: session }, { data: prompts }] = await Promise.all([
    supabase
      .from("sessions")
      .select("session_id, title, status, current_prompt_id")
      .eq("session_id", sessionId)
      .single(),
    supabase
      .from("prompts")
      .select("prompt_id, slide_index, kind, content")
      .eq("session_id", sessionId)
      .order("slide_index"),
  ]);

  console.log(session, prompts);

  // pass to a client component <SessionBuilder session={session} prompts={prompts} />
  return <div>builder here</div>;
}
