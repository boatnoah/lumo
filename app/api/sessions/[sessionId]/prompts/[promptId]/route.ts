import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string; promptId: string } },
) {
  const supabase = await createClient();

  const sessionId = Number(params.sessionId);
  const promptId = Number(params.promptId);
  if (!Number.isFinite(sessionId) || !Number.isFinite(promptId)) {
    return NextResponse.json(
      { error: "That session or prompt id looks invalid." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const hasIsOpen = Object.prototype.hasOwnProperty.call(body ?? {}, "is_open");
  const hasReleased = Object.prototype.hasOwnProperty.call(
    body ?? {},
    "released",
  );

  if (!hasIsOpen && !hasReleased) {
    return NextResponse.json(
      { error: "Provide a field to update." },
      { status: 400 },
    );
  }

  const is_open = hasIsOpen
    ? (body as { is_open: unknown }).is_open
    : undefined;
  const released = hasReleased
    ? (body as { released: unknown }).released
    : undefined;

  if (hasIsOpen && typeof is_open !== "boolean") {
    return NextResponse.json(
      { error: "is_open must be a boolean." },
      { status: 400 },
    );
  }

  if (hasReleased && typeof released !== "boolean") {
    return NextResponse.json(
      { error: "released must be a boolean." },
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

  if (profile?.role !== "teacher") {
    return NextResponse.json(
      { error: "Only teachers can update prompts." },
      { status: 403 },
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id, owner_id")
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

  if (session.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the session owner can update prompts." },
      { status: 403 },
    );
  }

  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("prompt_id, session_id, is_open, released")
    .eq("prompt_id", promptId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (promptError) {
    return NextResponse.json(
      { error: "Unable to find that prompt." },
      { status: 500 },
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "That prompt does not belong to this session." },
      { status: 404 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (hasIsOpen) updates.is_open = is_open;
  if (hasReleased) updates.released = released;

  const { data: updated, error: updateError } = await supabase
    .from("prompts")
    .update(updates)
    .eq("prompt_id", promptId)
    .eq("session_id", sessionId)
    .select(
      "prompt_id, session_id, slide_index, kind, content, is_open, released",
    )
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Could not update that prompt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ prompt: updated }, { status: 200 });
}
