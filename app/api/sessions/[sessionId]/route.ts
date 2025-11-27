import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { sessionId?: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionIdParam = params.sessionId;
  const sessionIdFilter = Number.isNaN(Number(sessionIdParam))
    ? sessionIdParam
    : Number(sessionIdParam);

  if (!sessionIdParam) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

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

  const { error: promptsError } = await supabase
    .from("prompts")
    .delete()
    .eq("session_id", sessionIdFilter);

  if (promptsError) {
    return NextResponse.json(
      { error: promptsError.message },
      { status: 500 },
    );
  }

  const { data: deletedSession, error: deleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("session_id", sessionIdFilter)
    .select("session_id")
    .maybeSingle();

  if (deleteError || !deletedSession) {
    return NextResponse.json(
      { error: deleteError?.message ?? "Failed to delete session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
