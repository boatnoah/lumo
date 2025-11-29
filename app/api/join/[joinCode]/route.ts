import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const JOIN_CODE_PATTERN = /^\d{6}$/;

export async function POST(
  _request: Request,
  { params }: { params: { joinCode: string } },
) {
  const supabase = await createClient();

  const joinCode = (params.joinCode || "").trim();
  if (!JOIN_CODE_PATTERN.test(joinCode)) {
    return NextResponse.json(
      { error: "That code format looks off." },
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
      { error: "Only students can join sessions." },
      { status: 403 },
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id, title, status, join_code, current_prompt")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json(
      { error: "Unable to look up that session right now." },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json(
      { error: "We couldn't find a session with that code." },
      { status: 404 },
    );
  }

  if (session.status !== "live") {
    return NextResponse.json(
      { error: "That session isn't live right now." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();

  const { error: closeError } = await supabase
    .from("session_members")
    .update({ left_at: now })
    .eq("session_id", session.session_id)
    .eq("user_id", user.id)
    .is("left_at", null);

  if (closeError) {
    return NextResponse.json(
      { error: "Could not update your session status." },
      { status: 500 },
    );
  }

  const { data: member, error: insertError } = await supabase
    .from("session_members")
    .insert({
      session_id: session.session_id,
      user_id: user.id,
      joined_at: now,
      left_at: null,
    })
    .select("id, joined_at")
    .single();

  if (insertError || !member) {
    return NextResponse.json(
      { error: "Could not join that session right now." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      session_id: session.session_id,
      title: session.title,
      status: session.status,
      join_code: session.join_code,
      current_prompt: session.current_prompt,
      member_id: member.id,
      joined_at: member.joined_at,
    },
    { status: 201 },
  );
}
