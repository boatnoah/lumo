import crypto from "crypto";
import { execFile } from "child_process";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import { promisify } from "util";
import { promises as fs } from "fs";

import { createClient } from "@/lib/supabase/server";

const execFileAsync = promisify(execFile);

const MAX_PDF_PAGES = 50;
// Slides stay crisp at 120 DPI without ballooning file sizes.
const RENDER_DPI = 120;
const STORAGE_BUCKET = "slides";

export const runtime = "nodejs";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: authError?.message ?? "Unauthorized" },
      { status: 401 },
    );
  }

  let tempDir: string | null = null;

  try {
    const form = await req.formData();
    const sessionIdRaw = form.get("session_id");
    const pdfFile = form.get("file");

    if (!sessionIdRaw || typeof sessionIdRaw !== "string") {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 },
      );
    }

    const sessionId = Number(sessionIdRaw);
    if (!Number.isFinite(sessionId)) {
      return NextResponse.json(
        { error: "session_id must be a number" },
        { status: 400 },
      );
    }

    if (!(pdfFile instanceof File)) {
      return NextResponse.json(
        { error: "file must be provided and must be a PDF" },
        { status: 400 },
      );
    }

    const mime = pdfFile.type?.toLowerCase();
    if (mime && mime !== "application/pdf" && mime !== "application/x-pdf") {
      return NextResponse.json(
        { error: "Only PDF uploads are supported" },
        { status: 415 },
      );
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    if (!isPdfFile(pdfBuffer)) {
      return NextResponse.json(
        { error: "Uploaded file does not look like a PDF" },
        { status: 415 },
      );
    }

    const sessionCheck = await validateSessionOwnership(
      supabase,
      sessionId,
      user.id,
    );
    if (sessionCheck.status !== "ok") {
      return NextResponse.json(
        { error: sessionCheck.message },
        { status: sessionCheck.statusCode },
      );
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-upload-"));
    const pdfPath = path.join(tempDir, "source.pdf");
    await fs.writeFile(pdfPath, pdfBuffer);

    const pageCount = await getPdfPageCount(pdfPath);
    if (pageCount > MAX_PDF_PAGES) {
      return NextResponse.json(
        {
          error: `PDF has ${pageCount} pages; max allowed is ${MAX_PDF_PAGES}`,
        },
        { status: 400 },
      );
    }

    const renderedPages = await renderPdfToPng(pdfPath, tempDir);

    const uploadedImages = [];
    for (const page of renderedPages) {
      const storagePath = buildStoragePath(sessionId, page.pageNumber);
      const fileBuffer = await fs.readFile(page.path);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 },
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

      uploadedImages.push({
        page: page.pageNumber,
        path: storagePath,
        publicUrl,
      });
    }

    return NextResponse.json({
      session_id: sessionId,
      page_count: pageCount,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("PDF upload failed:", error);
    if (isMissingPdfToolsError(error)) {
      return NextResponse.json(
        { error: "PDF rendering tools are not available on the server" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 },
    );
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function isPdfFile(buffer: Buffer) {
  return buffer.subarray(0, 4).toString("utf8") === "%PDF";
}

function buildStoragePath(sessionId: number, pageNumber: number) {
  return `${sessionId}/${crypto.randomUUID()}-page-${pageNumber}.png`;
}

async function validateSessionOwnership(
  supabase: SupabaseClient,
  sessionId: number,
  userId: string,
) {
  const { data, error } = await supabase
    .from("sessions")
    .select("owner_id")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return { status: "error", statusCode: 404, message: "Session not found" };
  }

  if (data.owner_id !== userId) {
    return { status: "error", statusCode: 403, message: "Forbidden" };
  }

  return { status: "ok" as const };
}

async function getPdfPageCount(pdfPath: string) {
  const { stdout } = await execFileAsync("pdfinfo", [pdfPath]);
  const match = stdout.match(/Pages:\s+(\d+)/i);
  if (!match) {
    throw new Error("Unable to determine PDF page count");
  }
  return Number(match[1]);
}

async function renderPdfToPng(pdfPath: string, outputDir: string) {
  const outputPrefix = path.join(outputDir, "page");
  await execFileAsync("pdftoppm", [
    "-png",
    "-r",
    String(RENDER_DPI),
    pdfPath,
    outputPrefix,
  ]);

  const files = await fs.readdir(outputDir);
  const pages = files
    .filter((file) => /^page-\d+\.png$/i.test(file))
    .map((file) => {
      const match = file.match(/(\d+)\.png$/i);
      const pageNumber = match ? Number(match[1]) : 0;
      return {
        path: path.join(outputDir, file),
        pageNumber,
      };
    })
    .sort((a, b) => a.pageNumber - b.pageNumber);

  if (!pages.length) {
    throw new Error("No pages were rendered from the PDF");
  }

  return pages;
}

function isMissingPdfToolsError(error: unknown) {
  const err = error as NodeJS.ErrnoException;
  return (
    err?.code === "ENOENT" ||
    err?.message?.includes("pdfinfo") ||
    err?.message?.includes("pdftoppm")
  );
}
