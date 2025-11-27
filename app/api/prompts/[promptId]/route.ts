import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { promptId?: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const promptIdParam = params.promptId;
  const promptId = Number(promptIdParam);

  if (!promptIdParam || Number.isNaN(promptId)) {
    return NextResponse.json(
      { error: "Invalid prompt id" },
      { status: 400 },
    );
  }

  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("prompt_id, session_id")
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (promptError) {
    return NextResponse.json(
      { error: promptError.message },
      { status: 500 },
    );
  }

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const sessionIdFilter = Number.isNaN(Number(prompt.session_id))
    ? prompt.session_id
    : Number(prompt.session_id);

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id, owner_id")
    .eq("session_id", sessionIdFilter)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: deletedPrompt, error: deleteError } = await supabase
    .from("prompts")
    .delete()
    .eq("prompt_id", promptId)
    .eq("session_id", sessionIdFilter)
    .select("prompt_id")
    .maybeSingle();

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  if (!deletedPrompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
