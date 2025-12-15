import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
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
      { error: "Only teachers can delete sessions." },
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
      { error: "Only the session owner can delete it." },
      { status: 403 },
    );
  }

  const { data: prompts, error: promptsError } = await supabase
    .from("prompts")
    .select("prompt_id, kind, content")
    .eq("session_id", sessionId);

  if (promptsError) {
    return NextResponse.json(
      { error: "Could not load prompts for that session." },
      { status: 500 },
    );
  }

  const promptIds = (prompts ?? [])
    .map((prompt) => prompt.prompt_id)
    .filter(Boolean);

  const slidePaths: string[] = [];
  (prompts ?? []).forEach((prompt) => {
    if ((prompt as { kind?: string }).kind !== "slide") return;
    const content = (prompt as { content?: unknown })?.content;
    const path = extractStoragePath(content);
    if (path) {
      slidePaths.push(path);
    }
  });

  if (promptIds.length > 0) {
    const { error: answersError } = await supabase
      .from("answers")
      .delete()
      .in("prompt_id", promptIds);

    if (answersError) {
      return NextResponse.json(
        { error: "Could not clear responses for that session." },
        { status: 500 },
      );
    }
  }

  const { error: messagesError } = await supabase
    .from("messages")
    .delete()
    .eq("session_id", sessionId);

  if (messagesError) {
    return NextResponse.json(
      { error: "Could not clear chat for that session." },
      { status: 500 },
    );
  }

  const { error: promptsDeleteError } = await supabase
    .from("prompts")
    .delete()
    .eq("session_id", sessionId);

  if (promptsDeleteError) {
    return NextResponse.json(
      { error: "Could not remove prompts for that session." },
      { status: 500 },
    );
  }

  const additionalStoragePaths: string[] = [];
  const { data: storedFiles } = await supabase.storage
    .from("slides")
    .list(sessionId.toString());

  (storedFiles ?? []).forEach((file) => {
    if (file?.name) {
      additionalStoragePaths.push(`${sessionId}/${file.name}`);
    }
  });

  const removeTargets = Array.from(
    new Set<string>([...slidePaths, ...additionalStoragePaths]),
  ).filter(Boolean);

  if (removeTargets.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("slides")
      .remove(removeTargets);

    if (storageError) {
      return NextResponse.json(
        { error: "Could not remove session media." },
        { status: 500 },
      );
    }
  }

  const { error: membershipsError } = await supabase
    .from("session_members")
    .delete()
    .eq("session_id", sessionId);

  if (membershipsError) {
    return NextResponse.json(
      { error: "Could not remove participants for that session." },
      { status: 500 },
    );
  }

  const { error: sessionDeleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("session_id", sessionId)
    .eq("owner_id", user.id);

  if (sessionDeleteError) {
    return NextResponse.json(
      { error: "Could not delete that session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

function extractStoragePath(content: unknown): string | null {
  if (!content || typeof content !== "object") return null;

  const candidate = content as { storagePath?: unknown; imageUrl?: unknown };

  if (typeof candidate.storagePath === "string") {
    const trimmed = candidate.storagePath.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (typeof candidate.imageUrl === "string") {
    const marker = "/storage/v1/object/public/slides/";
    const idx = candidate.imageUrl.indexOf(marker);
    if (idx >= 0) {
      return candidate.imageUrl.slice(idx + marker.length);
    }
  }

  return null;
}
