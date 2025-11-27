import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type PromptKind = "mcq" | "short_text" | "long_text" | "slide";

type CreatePromptPayload = {
  sessionId?: string | number;
  kind?: PromptKind;
  slideIndex?: number;
  createNewSlide?: boolean;
  title?: string;
  detail?: string;
  question?: string;
  options?: string[];
  correctOptionIndex?: number;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionIdParam = searchParams.get("sessionId");

  if (!sessionIdParam) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 },
    );
  }

  const sessionIdFilter = Number.isNaN(Number(sessionIdParam))
    ? sessionIdParam
    : Number(sessionIdParam);

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

  const { data: prompts, error: promptsError } = await supabase
    .from("prompts")
    .select("prompt_id, session_id, slide_index, kind, content, created_at")
    .eq("session_id", sessionIdFilter)
    .order("slide_index", { ascending: true });

  if (promptsError) {
    return NextResponse.json(
      { error: promptsError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ prompts: prompts ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreatePromptPayload;
  const {
    sessionId,
    kind,
    slideIndex,
    createNewSlide,
    title,
    detail,
    options,
    question,
    correctOptionIndex,
  } = body;

  if (!sessionId || !kind) {
    return NextResponse.json(
      { error: "Missing session or prompt kind" },
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

  let targetSlideIndex =
    typeof slideIndex === "number" && !Number.isNaN(slideIndex)
      ? slideIndex
      : undefined;

  if (createNewSlide || typeof targetSlideIndex !== "number") {
    const { data: maxRows, error: fetchError } = await supabase
      .from("prompts")
      .select("slide_index")
      .eq("session_id", sessionIdFilter)
      .order("slide_index", { ascending: false })
      .limit(1);

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 },
      );
    }

    const maxSlideIndex = maxRows?.[0]?.slide_index ?? 0;
    targetSlideIndex =
      typeof maxSlideIndex === "number" && !Number.isNaN(maxSlideIndex)
        ? maxSlideIndex + 1
        : 1;
  }

  const content = buildPromptContent(kind, {
    title,
    detail,
    slideIndex: targetSlideIndex,
    question,
    options,
    correctOptionIndex,
  });

  const { data: insertedPrompt, error: insertError } = await supabase
    .from("prompts")
    .insert({
      session_id: sessionIdFilter,
      slide_index: targetSlideIndex,
      kind,
      created_by: user.id,
      content,
    })
    .select("prompt_id, session_id, slide_index, kind, content, created_at")
    .single();

  if (insertError || !insertedPrompt) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create prompt" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    prompt: insertedPrompt,
  });
}

function buildPromptContent(
  kind: PromptKind,
  meta: {
    title?: string;
    detail?: string;
    slideIndex?: number;
    question?: string;
    options?: string[];
    correctOptionIndex?: number;
  },
) {
  const defaultTitles: Record<PromptKind, string> = {
    mcq: "New multiple choice prompt",
    short_text: "New short response prompt",
    long_text: "New long response prompt",
    slide: "New slide",
  };

  const defaultDetails: Record<PromptKind, string> = {
    mcq: "Add options and customize your question.",
    short_text: "Describe what students should answer.",
    long_text: "Describe what students should write about.",
    slide: "Upload supporting materials or add talking points.",
  };

  const baseTitle = meta.title ?? defaultTitles[kind];
  const baseDetail = meta.detail ?? defaultDetails[kind];

  if (kind === "mcq") {
    const cleanedOptions = Array.isArray(meta.options)
      ? meta.options
          .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
          .filter((opt) => opt.length > 0)
      : [];

    const resolvedCorrectIndex =
      typeof meta.correctOptionIndex === "number" &&
      meta.correctOptionIndex >= 0 &&
      meta.correctOptionIndex < cleanedOptions.length
        ? meta.correctOptionIndex
        : cleanedOptions.length > 0
          ? 0
          : null;

    return {
      title: baseTitle,
      detail: baseDetail,
      question:
        meta.question && meta.question.trim().length > 0
          ? meta.question.trim()
          : baseTitle,
      options: cleanedOptions,
      correctOptionIndex: resolvedCorrectIndex,
    };
  }

  if (kind === "slide") {
    return {
      title: baseTitle,
      detail: baseDetail,
      assetUrl: null,
      assetPath: null,
      assetType: null,
      assetName: null,
      page: null,
      totalPages: null,
    };
  }

  return {
    title: baseTitle,
    detail: baseDetail,
    prompt: "Tap to edit response instructions",
    responseLength: kind === "long_text" ? "long" : "short",
  };
}
