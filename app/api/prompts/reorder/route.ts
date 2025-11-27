import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ReorderPayload = {
  sessionId?: string | number;
  promptIds?: Array<number>;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ReorderPayload;
  const { sessionId, promptIds } = body;

  if (!sessionId || !Array.isArray(promptIds) || promptIds.length === 0) {
    return NextResponse.json(
      { error: "Missing sessionId or promptIds" },
      { status: 400 },
    );
  }

  const sessionIdFilter = Number.isNaN(Number(sessionId))
    ? sessionId
    : Number(sessionId);

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

  for (const [index, promptId] of promptIds.entries()) {
    if (typeof promptId !== "number") {
      continue;
    }

    const { error: updateError } = await supabase
      .from("prompts")
      .update({ slide_index: index + 1 })
      .eq("session_id", sessionIdFilter)
      .eq("prompt_id", promptId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
