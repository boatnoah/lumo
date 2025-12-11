import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { prompt_id, choice_index, text_answer } = body as {
    prompt_id?: unknown;
    choice_index?: unknown;
    text_answer?: unknown;
  };

  if (typeof prompt_id !== "number") {
    return NextResponse.json(
      { error: "prompt_id is required." },
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
      { error: "Only students can submit answers." },
      { status: 403 },
    );
  }

  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("prompt_id, session_id, kind, is_open")
    .eq("prompt_id", prompt_id)
    .maybeSingle();

  if (promptError) {
    return NextResponse.json(
      { error: "Unable to find that prompt." },
      { status: 500 },
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "That prompt was not found." },
      { status: 404 },
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id, status, current_prompt")
    .eq("session_id", prompt.session_id)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json(
      { error: "Unable to load session info." },
      { status: 500 },
    );
  }

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.status !== "live") {
    return NextResponse.json(
      { error: "That session is not live." },
      { status: 403 },
    );
  }

  if (session.current_prompt !== prompt.prompt_id) {
    return NextResponse.json(
      { error: "That prompt is not currently active." },
      { status: 403 },
    );
  }

  if (!prompt.is_open) {
    return NextResponse.json(
      { error: "Responses are closed for this prompt." },
      { status: 403 },
    );
  }

  // basic validation by kind
  if (prompt.kind === "mcq") {
    if (
      choice_index === undefined ||
      choice_index === null ||
      typeof choice_index !== "number"
    ) {
      return NextResponse.json(
        { error: "Select an option before submitting." },
        { status: 400 },
      );
    }
  } else {
    if (!text_answer || typeof text_answer !== "string") {
      return NextResponse.json(
        { error: "Enter a response before submitting." },
        { status: 400 },
      );
    }
  }

  const { data: answer, error: insertError } = await supabase
    .from("answers")
    .insert({
      prompt_id: prompt.prompt_id,
      user_id: user.id,
      choice_index: prompt.kind === "mcq" ? (choice_index as number) : null,
      text_answer: prompt.kind === "mcq" ? null : (text_answer as string),
    })
    .select("answer_id, created_at")
    .single();

  if (insertError || !answer) {
    return NextResponse.json(
      { error: "You have already submitted an answer for this prompt." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { answer_id: answer.answer_id, created_at: answer.created_at },
    { status: 201 },
  );
}
