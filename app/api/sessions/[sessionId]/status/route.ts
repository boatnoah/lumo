import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type StatusPayload = {
  status?: "draft" | "live";
};

export async function PATCH(
  request: Request,
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

  const body = (await request.json().catch(() => ({}))) as StatusPayload;
  const nextStatus = body.status;

  if (!nextStatus || (nextStatus !== "draft" && nextStatus !== "live")) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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

  const { data: updatedSession, error: updateError } = await supabase
    .from("sessions")
    .update({ status: nextStatus })
    .eq("session_id", sessionIdFilter)
    .select("session_id, status")
    .maybeSingle();

  if (updateError || !updatedSession) {
    return NextResponse.json(
      { error: updateError?.message ?? "Failed to update session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: updatedSession });
}
