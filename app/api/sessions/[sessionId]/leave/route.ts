import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { sessionId: string } },
) {
  const supabase = await createClient();

  const sessionId = Number(params.sessionId);
  if (!Number.isFinite(sessionId)) {
    return NextResponse.json(
      { error: "That session id looks invalid." },
      { status: 400 },
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: authError?.message || "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to verify your profile right now." },
      { status: 500 },
    );
  }

  if (profile?.role !== "student") {
    return NextResponse.json(
      { error: "Only students can leave sessions." },
      { status: 403 },
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json(
      { error: "Unable to look up that session right now." },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json(
      { error: "We couldn't find that session." },
      { status: 404 },
    );
  }

  const { data: membership, error: leaveError } = await supabase
    .from("session_members")
    .update({ left_at: new Date().toISOString() })
    .eq("session_id", session.session_id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .select("id, joined_at, left_at")
    .maybeSingle();

  if (leaveError) {
    return NextResponse.json(
      { error: "Could not update your session status." },
      { status: 500 },
    );
  }

  if (!membership) {
    return NextResponse.json(
      { error: "You're not currently in that session." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      member_id: membership.id,
      joined_at: membership.joined_at,
      left_at: membership.left_at,
    },
    { status: 200 },
  );
}
