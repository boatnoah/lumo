import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SLIDES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_SLIDES_BUCKET ?? "slides";

type UploadStats = {
  createdSlides: number;
  storagePath: string;
  assetUrl: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const sessionId = formData.get("sessionId");
  const file = formData.get("file");

  if (!sessionId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing session or file upload" },
      { status: 400 },
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
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

  const customTitle =
    typeof formData.get("title") === "string"
      ? formData.get("title")?.toString().trim()
      : null;
  const customDetail =
    typeof formData.get("detail") === "string"
      ? formData.get("detail")?.toString().trim()
      : null;

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const pageCount = Math.max(1, estimatePdfPages(fileBuffer) ?? 1);
  const objectName = `${sessionIdFilter}/${randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(SLIDES_BUCKET)
    .upload(objectName, fileBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.log(uploadError);
    return NextResponse.json(
      { error: uploadError.message ?? "Failed to store PDF" },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(SLIDES_BUCKET).getPublicUrl(objectName);

  let uploadStats: UploadStats;
  try {
    uploadStats = await createSlidePrompts({
      supabase,
      sessionId: sessionIdFilter,
      userId: user.id,
      pageCount,
      assetUrl: publicUrl,
      storagePath: objectName,
      assetName: file.name,
      customTitle,
      customDetail,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to persist slides";
    console.log(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    createdSlides: uploadStats.createdSlides,
    assetUrl: publicUrl,
  });
}

async function createSlidePrompts(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  sessionId: number | string;
  userId: string;
  pageCount: number;
  assetUrl: string;
  storagePath: string;
  assetName: string;
  customTitle?: string | null;
  customDetail?: string | null;
}): Promise<UploadStats> {
  const {
    supabase,
    sessionId,
    userId,
    pageCount,
    assetUrl,
    storagePath,
    assetName,
    customTitle,
    customDetail,
  } = params;

  const { data: maxRows, error: fetchError } = await supabase
    .from("prompts")
    .select("slide_index")
    .eq("session_id", sessionId)
    .order("slide_index", { ascending: false })
    .limit(1);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const maxSlideIndex = maxRows?.[0]?.slide_index ?? 0;

  const inserts = Array.from({ length: pageCount }, (_, index) => ({
    session_id: sessionId,
    slide_index: maxSlideIndex + index + 1,
    kind: "slide",
    created_by: userId,
    content: {
      title:
        customTitle && pageCount === 1
          ? customTitle
          : customTitle
            ? `${customTitle} (page ${index + 1})`
            : `Slide ${maxSlideIndex + index + 1}`,
      detail: customDetail || "Uploaded from PDF",
      assetUrl: null,
      assetPath: storagePath,
      assetType: "pdf",
      assetName,
      page: index + 1,
      totalPages: pageCount,
    },
  }));

  const { error: insertError } = await supabase.from("prompts").insert(inserts);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    createdSlides: pageCount,
    storagePath,
    assetUrl,
  };
}

function estimatePdfPages(buffer: Buffer) {
  try {
    const asString = buffer.toString("latin1");
    let maxCount = 0;
    const countRegex = /\/Count\s+(\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = countRegex.exec(asString))) {
      const value = Number.parseInt(match[1], 10);
      if (!Number.isNaN(value)) {
        maxCount = Math.max(maxCount, value);
      }
    }
    if (maxCount > 0) {
      return maxCount;
    }
    const matches = asString.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : 1;
  } catch {
    return 1;
  }
}
