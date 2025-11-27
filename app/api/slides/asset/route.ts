import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type SlideAssetPayload = {
  sessionId?: string | number;
  slideIndex?: number;
  assetUrl?: string;
  storagePath?: string;
  assetType?: "image" | "pdf";
  assetName?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SlideAssetPayload;
  const { sessionId, slideIndex, assetUrl, storagePath, assetType, assetName } =
    body;

  if (!sessionId || typeof slideIndex !== "number" || !assetUrl || !assetType) {
    return NextResponse.json(
      { error: "Missing session, slide, or asset reference" },
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

  const { data: prompts, error: promptsError } = await supabase
    .from("prompts")
    .select("prompt_id, content")
    .eq("session_id", sessionIdFilter)
    .eq("slide_index", slideIndex);

  if (promptsError) {
    return NextResponse.json({ error: promptsError.message }, { status: 500 });
  }

  if (!prompts?.length) {
    return NextResponse.json(
      { error: "No prompts found for this slide" },
      { status: 404 },
    );
  }

  for (const prompt of prompts) {
    const content = {
      ...(prompt.content as Record<string, unknown> | null),
      assetUrl,
      assetPath: storagePath ?? null,
      assetType,
      assetName: assetName ?? null,
    };

    if (assetType === "image") {
      content.imageUrl = assetUrl;
      content.imagePath = storagePath ?? null;
    }

    const { error: updateError } = await supabase
      .from("prompts")
      .update({ content })
      .eq("prompt_id", prompt.prompt_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, assetUrl, assetType });
}
