import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

type SessionStatus = "draft" | "live" | "ended";

function isValidStatus(status: unknown): status is SessionStatus {
  return status === "draft" || status === "live" || status === "ended";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const supabase = await createClient();

  const { sessionId: sessionIdRaw } = await context.params;
  const sessionId = Number(sessionIdRaw);
  if (!Number.isFinite(sessionId)) {
    return NextResponse.json(
      { error: "That session id looks invalid." },
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

  const status = (body as { status?: unknown })?.status;
  const hasCurrentPrompt = Object.prototype.hasOwnProperty.call(
    body ?? {},
    "current_prompt",
  );
  const currentPrompt = hasCurrentPrompt
    ? (body as { current_prompt: unknown }).current_prompt
    : undefined;

  if (!status && !hasCurrentPrompt) {
    return NextResponse.json(
      { error: "Provide a status or current_prompt to update." },
      { status: 400 },
    );
  }

  if (status && !isValidStatus(status)) {
    return NextResponse.json(
      { error: "Invalid status value." },
      { status: 400 },
    );
  }

  if (
    hasCurrentPrompt &&
    currentPrompt !== null &&
    typeof currentPrompt !== "number"
  ) {
    return NextResponse.json(
      { error: "current_prompt must be a number or null." },
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
      { error: "Only teachers can change session status." },
      { status: 403 },
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id, owner_id, status, current_prompt")
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
      { error: "Only the session owner can change status." },
      { status: 403 },
    );
  }

  if (hasCurrentPrompt && currentPrompt !== null) {
    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("prompt_id")
      .eq("prompt_id", currentPrompt)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (promptError) {
      return NextResponse.json(
        { error: "Unable to validate that prompt." },
        { status: 500 },
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "That prompt does not belong to this session." },
        { status: 400 },
      );
    }
  }

  if (
    status === "live" &&
    ((hasCurrentPrompt && currentPrompt === null) ||
      (!hasCurrentPrompt && session.current_prompt === null))
  ) {
    return NextResponse.json(
      { error: "Pick a prompt before going live." },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (hasCurrentPrompt) updates.current_prompt = currentPrompt;

  const { data: updated, error: updateError } = await supabase
    .from("sessions")
    .update(updates)
    .eq("session_id", sessionId)
    .eq("owner_id", user.id)
    .select("session_id, title, description, status, join_code, current_prompt")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Could not update the session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: updated }, { status: 200 });
}
