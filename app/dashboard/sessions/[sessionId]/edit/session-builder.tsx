"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVerticalIcon,
  ImageIcon,
  Loader2Icon,
  ListChecksIcon,
  SaveIcon,
  TextIcon,
  TypeIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type PromptKind = "mcq" | "short_text" | "long_text" | "slide";

type McqContent = {
  question: string;
  options: string[];
  correctIndex: number | null;
};

type ShortTextContent = {
  prompt: string;
  charLimit?: number | null;
};

type LongTextContent = {
  prompt: string;
  wordLimit?: number | null;
  rubricHint?: string;
};

type SlideContent = {
  imageUrl: string;
  sourcePdf?: string;
  page?: number;
  storagePath?: string;
};

type PromptContent =
  | McqContent
  | ShortTextContent
  | LongTextContent
  | SlideContent;

type PromptRow = {
  prompt_id?: number;
  slide_index: number;
  kind: PromptKind;
  content: unknown;
  is_open?: boolean;
  released?: boolean;
  created_by: string;
};

type PromptDraft = {
  id: string;
  prompt_id?: number;
  slide_index: number;
  kind: PromptKind;
  content: PromptContent;
  is_open: boolean;
  released: boolean;
  created_by: string;
};

type Props = {
  sessionId: number;
  sessionTitle: string;
  sessionDescription: string;
  userId: string;
  initialPrompts: PromptRow[];
};

const STORAGE_BUCKET = "slides";

export default function SessionBuilder({
  sessionId,
  sessionTitle,
  sessionDescription,
  userId,
  initialPrompts,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [title, setTitle] = useState(sessionTitle);
  const [description, setDescription] = useState(sessionDescription);
  const [prompts, setPrompts] = useState<PromptDraft[]>(() =>
    normalizePrompts(initialPrompts, userId),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    prompts[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [baselineIds, setBaselineIds] = useState<number[]>(
    initialPrompts.map((p) => p.prompt_id).filter(Boolean) as number[],
  );

  useEffect(() => {
    const normalized = normalizePrompts(initialPrompts, userId);
    setPrompts(normalized);
    setSelectedId(normalized[0]?.id ?? null);
    setTitle(sessionTitle);
    setDescription(sessionDescription);
    setBaselineIds(
      initialPrompts.map((p) => p.prompt_id).filter(Boolean) as number[],
    );
  }, [initialPrompts, sessionDescription, sessionTitle, userId]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
  );

  const selected = prompts.find((p) => p.id === selectedId) ?? null;

  const handleAddPrompt = (kind: PromptKind) => {
    const newPrompt = createPromptDraft(kind, prompts.length, userId);
    setPrompts((prev) => [...prev, newPrompt]);
    setSelectedId(newPrompt.id);
  };

  const handleDelete = (id: string) => {
    const target = prompts.find((p) => p.id === id);
    if (target?.kind === "slide") {
      const slide = target.content as SlideContent;
      const storagePath =
        slide.storagePath || extractPathFromPublicUrl(slide.imageUrl);
      if (storagePath) {
        supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      }
    }

    setPrompts((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const reindexed = filtered.map((p, idx) => ({ ...p, slide_index: idx }));
      const nextSelected =
        selectedId === id ? (reindexed[0]?.id ?? null) : selectedId;
      setSelectedId(nextSelected);
      return reindexed;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPrompts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((p, idx) => ({ ...p, slide_index: idx }));
    });
  };

  const updatePromptContent = (id: string, content: PromptContent) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content } : p)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const ordered = prompts.map((p, idx) => ({ ...p, slide_index: idx }));
      const validationError = validatePrompts(ordered);
      if (validationError) {
        toast.error(validationError);
        setSaving(false);
        return;
      }
      const toDelete = baselineIds.filter(
        (id) => !ordered.some((p) => p.prompt_id === id),
      );

      if (toDelete.length) {
        const { error: deleteError } = await supabase
          .from("prompts")
          .delete()
          .in("prompt_id", toDelete);
        if (deleteError) throw deleteError;
      }

      // Existing prompts: update in place
      const existingPayload = ordered
        .filter((p) => p.prompt_id)
        .map((p) => ({
          prompt_id: p.prompt_id,
          session_id: sessionId,
          created_by: p.created_by || userId,
          kind: p.kind,
          slide_index: p.slide_index,
          content: p.content,
          is_open: p.is_open ?? false,
          released: p.released ?? false,
        }));
      if (existingPayload.length) {
        const { error: upsertError } = await supabase
          .from("prompts")
          .upsert(existingPayload, { onConflict: "prompt_id" });
        if (upsertError) throw upsertError;
      }

      // New prompts: insert fresh rows
      const newPayload = ordered
        .filter((p) => !p.prompt_id)
        .map((p) => ({
          session_id: sessionId,
          created_by: p.created_by || userId,
          kind: p.kind,
          slide_index: p.slide_index,
          content: p.content,
          is_open: p.is_open ?? false,
          released: p.released ?? false,
        }));
      if (newPayload.length) {
        const { error: insertError } = await supabase
          .from("prompts")
          .insert(newPayload);
        if (insertError) throw insertError;
      }

      const { error: sessionError } = await supabase
        .from("sessions")
        .update({ title: title.trim() || "Untitled session", description })
        .eq("session_id", sessionId);
      if (sessionError) throw sessionError;

      const { data: refreshed, error: refetchError } = await supabase
        .from("prompts")
        .select(
          "prompt_id, slide_index, kind, content, is_open, released, created_by",
        )
        .eq("session_id", sessionId)
        .order("slide_index");
      if (refetchError) throw refetchError;

      const normalized = normalizePrompts(refreshed ?? [], userId);
      setPrompts(normalized);
      setBaselineIds(
        (refreshed ?? []).map((p) => p.prompt_id).filter(Boolean) as number[],
      );
      setSelectedId((id) => id ?? normalized[0]?.id ?? null);
      toast.success("Saved");
      playChime(audioCtxRef, 760);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePdfPick = () => {
    fileInputRef.current?.click();
  };

  const handlePdfSelected = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("session_id", String(sessionId));
      form.set("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json?.error ?? "Upload failed");
        return;
      }

      const additions =
        (json.images as { page: number; publicUrl: string; path: string }[]) ||
        [];

      const newPrompts = additions.map((img, idx) =>
        createSlidePromptDraft(
          prompts.length + idx,
          userId,
          img.publicUrl,
          file.name,
          img.page,
          img.path,
        ),
      );

      setPrompts((prev) => [...prev, ...newPrompts]);
      setSelectedId(newPrompts[0]?.id ?? selectedId);
      toast.success("Slides added");
      playChime(audioCtxRef, 1040);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected upload error";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-5 lg:px-6">
      <div className="grid gap-3 rounded-xl border bg-card/60 px-4 py-4 shadow-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-center sm:gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">
            Title
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">
            Description
          </Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this session about?"
          />
        </div>
        <div className="flex items-center gap-2 pt-2 sm:pt-6 sm:justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <SaveIcon className="h-4 w-4" />
            {saving ? "Saving..." : "Save session"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px,1fr] lg:gap-4">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Slides & Prompts</CardTitle>
            <Badge variant="outline">{prompts.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddPrompt("mcq")}
              >
                <ListChecksIcon className="h-4 w-4" />
                MCQ
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddPrompt("short_text")}
              >
                <TypeIcon className="h-4 w-4" />
                Short
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddPrompt("long_text")}
              >
                <TextIcon className="h-4 w-4" />
                Long
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePdfPick}
                disabled={uploading}
              >
                <UploadCloudIcon className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload slides"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePdfSelected(e.target.files?.[0] ?? null)}
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Converting slides…
              </div>
            )}
            {uploadError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            )}

            {!prompts.length && (
              <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Add a prompt or upload slides to get started.
              </div>
            )}

            {!!prompts.length && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={prompts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {prompts.map((prompt) => (
                      <SortableItem
                        key={prompt.id}
                        prompt={prompt}
                        active={prompt.id === selectedId}
                        onSelect={() => setSelectedId(prompt.id)}
                        onDelete={() => handleDelete(prompt.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">
              {selected ? "Current view" : "Select a prompt"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <PromptEditor
                  prompt={selected}
                  onChange={updatePromptContent}
                />
                <Separator />
                <PromptPreview prompt={selected} />
                <div className="flex justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selected.id)}
                  >
                    <XIcon className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={handleSave} size="sm" disabled={saving}>
                    <SaveIcon className="h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Select or add a prompt to edit.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SortableItem({
  prompt,
  active,
  onSelect,
  onDelete,
}: {
  prompt: PromptDraft;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: prompt.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 overflow-hidden rounded-lg border bg-card px-3 py-2 shadow-sm",
        active ? "ring-2 ring-primary" : "hover:border-primary/40",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
      >
        <GripVerticalIcon className="h-4 w-4" />
        <span className="sr-only">Drag to reorder</span>
      </button>
      <button
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <KindBadge kind={prompt.kind} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {prompt.kind === "slide"
              ? (prompt.content as SlideContent).sourcePdf ||
                "Slide from upload"
              : summarizePrompt(prompt)}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {prompt.kind === "slide"
              ? `Page ${(prompt.content as SlideContent).page ?? ""}`
              : "Click to edit"}
          </div>
        </div>
        {prompt.kind === "slide" && (
          <div className="ml-auto h-12 w-16 overflow-hidden rounded border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(prompt.content as SlideContent).imageUrl}
              alt="Slide"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </button>
      <button
        onClick={onDelete}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-destructive"
        aria-label="Delete prompt"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function PromptEditor({
  prompt,
  onChange,
}: {
  prompt: PromptDraft;
  onChange: (id: string, content: PromptContent) => void;
}) {
  if (prompt.kind === "mcq") {
    const content = prompt.content as McqContent;
    const updateOption = (i: number, value: string) => {
      const next = [...content.options];
      next[i] = value;
      onChange(prompt.id, { ...content, options: next });
    };

    const addOption = () => {
      onChange(prompt.id, { ...content, options: [...content.options, ""] });
    };

    const removeOption = (i: number) => {
      if (content.options.length <= 2) return;
      const next = content.options.filter((_, idx) => idx !== i);
      let nextCorrect = content.correctIndex;
      if (nextCorrect === i) nextCorrect = null;
      else if (nextCorrect !== null && nextCorrect > i) nextCorrect -= 1;
      onChange(prompt.id, {
        ...content,
        options: next,
        correctIndex: nextCorrect,
      });
    };

    const markCorrect = (i: number) => {
      onChange(prompt.id, { ...content, correctIndex: i });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Question</Label>
          <Input
            value={content.question}
            onChange={(e) =>
              onChange(prompt.id, { ...content, question: e.target.value })
            }
            placeholder="Ask something..."
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            <Button variant="ghost" size="sm" onClick={addOption}>
              Add option
            </Button>
          </div>
          <div className="space-y-2">
            {content.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${prompt.id}`}
                  checked={content.correctIndex === idx}
                  onChange={() => markCorrect(idx)}
                  className="h-4 w-4 accent-primary"
                  title="Mark as correct"
                />
                <Input
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(idx)}
                  disabled={content.options.length <= 2}
                  aria-label="Remove option"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (prompt.kind === "short_text" || prompt.kind === "long_text") {
    const content = prompt.content as ShortTextContent | LongTextContent;
    const isLong = prompt.kind === "long_text";
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Prompt</Label>
          <textarea
            className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
            value={content.prompt}
            onChange={(e) =>
              onChange(prompt.id, { ...content, prompt: e.target.value })
            }
            placeholder="Type the question or instruction..."
          />
        </div>
        <div className="space-y-2">
          <Label>
            {isLong ? "Word limit (optional)" : "Character limit (optional)"}
          </Label>
          <Input
            type="number"
            min={0}
            value={
              isLong
                ? ((content as LongTextContent).wordLimit ?? "")
                : ((content as ShortTextContent).charLimit ?? "")
            }
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              onChange(
                prompt.id,
                isLong
                  ? { ...(content as LongTextContent), wordLimit: value }
                  : { ...(content as ShortTextContent), charLimit: value },
              );
            }}
            placeholder={isLong ? "e.g. 100" : "e.g. 280"}
          />
        </div>
        {isLong && (
          <div className="space-y-2">
            <Label>Rubric hint (optional)</Label>
            <textarea
              className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              value={(content as LongTextContent).rubricHint ?? ""}
              onChange={(e) =>
                onChange(prompt.id, {
                  ...(content as LongTextContent),
                  rubricHint: e.target.value,
                })
              }
              placeholder="What does a good answer look like?"
            />
          </div>
        )}
      </div>
    );
  }

  if (prompt.kind === "slide") {
    const content = prompt.content as SlideContent;
    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {content.sourcePdf || "Slide"}
              </span>
            </div>
            {typeof content.page === "number" && (
              <Badge variant="outline">Page {content.page}</Badge>
            )}
          </div>
          <div className="overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.imageUrl}
              alt={content.sourcePdf || "Slide"}
              className="h-[260px] w-full object-contain bg-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function PromptPreview({ prompt }: { prompt: PromptDraft }) {
  if (prompt.kind === "mcq") {
    const content = prompt.content as McqContent;
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{content.question}</p>
        <div className="space-y-1">
          {content.options.map((opt, idx) => (
            <div
              key={idx}
              className="rounded-md border px-3 py-2 text-sm text-muted-foreground"
            >
              {opt || `Option ${idx + 1}`}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (prompt.kind === "short_text" || prompt.kind === "long_text") {
    const content = prompt.content as ShortTextContent | LongTextContent;
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{content.prompt}</p>
        <div className="rounded-md border px-3 py-4 text-sm text-muted-foreground">
          {prompt.kind === "short_text"
            ? "Student types a short response."
            : "Student types a paragraph response."}
        </div>
      </div>
    );
  }

  if (prompt.kind === "slide") {
    const content = prompt.content as SlideContent;
    return (
      <div className="space-y-2">
        <div className="rounded-lg border bg-muted/60 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.imageUrl}
            alt={content.sourcePdf || "Slide"}
            className="w-full rounded-md border bg-white object-contain"
          />
        </div>
      </div>
    );
  }

  return null;
}

function KindBadge({ kind }: { kind: PromptKind }) {
  const icon =
    kind === "mcq"
      ? ListChecksIcon
      : kind === "short_text"
        ? TypeIcon
        : kind === "long_text"
          ? TextIcon
          : ImageIcon;
  const Icon = icon;
  return (
    <Badge variant="outline" className="flex shrink-0 items-center gap-1">
      <Icon className="h-3.5 w-3.5" />
      {labelForKind(kind)}
    </Badge>
  );
}

function labelForKind(kind: PromptKind) {
  switch (kind) {
    case "mcq":
      return "MCQ";
    case "short_text":
      return "Short";
    case "long_text":
      return "Long";
    case "slide":
      return "Slide";
  }
}

function summarizePrompt(prompt: PromptDraft) {
  if (prompt.kind === "mcq") {
    return (prompt.content as McqContent).question || "Untitled MCQ";
  }
  if (prompt.kind === "short_text" || prompt.kind === "long_text") {
    return (
      (
        (prompt.content as ShortTextContent | LongTextContent).prompt ||
        "Untitled prompt"
      ).slice(0, 80) + ""
    );
  }
  if (prompt.kind === "slide") {
    return (prompt.content as SlideContent).sourcePdf || "Slide";
  }
  return "Prompt";
}

function normalizePrompts(rows: PromptRow[], userId: string): PromptDraft[] {
  return rows
    .map((row, idx) => {
      const kind = row.kind;
      let content: PromptContent;

      if (kind === "mcq") {
        const raw = row.content as Partial<McqContent> | null;
        const options =
          raw?.options?.filter((o) => typeof o === "string") || [];
        content = {
          question: raw?.question || "MCQ",
          options: options.length ? options : ["Option 1", "Option 2"],
          correctIndex:
            typeof raw?.correctIndex === "number" ? raw?.correctIndex : null,
          shuffle: !!raw?.shuffle,
        };
      } else if (kind === "short_text") {
        const raw = row.content as Partial<ShortTextContent> | null;
        content = {
          prompt: raw?.prompt || "Short response",
          charLimit: typeof raw?.charLimit === "number" ? raw?.charLimit : null,
        };
      } else if (kind === "long_text") {
        const raw = row.content as Partial<LongTextContent> | null;
        content = {
          prompt: raw?.prompt || "Long response",
          wordLimit: typeof raw?.wordLimit === "number" ? raw?.wordLimit : null,
          rubricHint: raw?.rubricHint || "",
        };
      } else {
        const raw = row.content as Partial<SlideContent> | null;
        content = {
          imageUrl: raw?.imageUrl || "",
          sourcePdf: raw?.sourcePdf,
          page: raw?.page,
          storagePath: raw?.storagePath,
        };
      }

      return {
        id: `prompt-${row.prompt_id ?? `new-${idx}`}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        prompt_id: row.prompt_id,
        slide_index: row.slide_index ?? idx,
        kind,
        content,
        is_open: !!row.is_open,
        released: !!row.released,
        created_by: row.created_by || userId,
      };
    })
    .sort((a, b) => a.slide_index - b.slide_index);
}

function validatePrompts(prompts: PromptDraft[]) {
  for (const p of prompts) {
    if (p.kind === "mcq") {
      const c = p.content as McqContent;
      const hasQuestion = c.question.trim().length > 0;
      const options = c.options.filter((o) => o.trim().length > 0);
      const hasEnoughOptions = options.length >= 2;
      const hasCorrect =
        typeof c.correctIndex === "number" &&
        c.correctIndex >= 0 &&
        c.correctIndex < c.options.length;
      if (!hasQuestion) return "MCQ needs a question.";
      if (!hasEnoughOptions) return "MCQ needs at least two options.";
      if (!hasCorrect) return "Select a correct option for the MCQ.";
    }
  }
  return null;
}

function createPromptDraft(
  kind: PromptKind,
  index: number,
  userId: string,
): PromptDraft {
  if (kind === "mcq") {
    return {
      id: crypto.randomUUID(),
      slide_index: index,
      kind,
      prompt_id: undefined,
      content: {
        question: "MCQ",
        options: ["Option 1", "Option 2"],
        correctIndex: null,
      },
      is_open: false,
      released: false,
      created_by: userId,
    };
  }

  if (kind === "short_text") {
    return {
      id: crypto.randomUUID(),
      slide_index: index,
      kind,
      prompt_id: undefined,
      content: { prompt: "Short response", charLimit: null },
      is_open: false,
      released: false,
      created_by: userId,
    };
  }

  if (kind === "long_text") {
    return {
      id: crypto.randomUUID(),
      slide_index: index,
      kind,
      prompt_id: undefined,
      content: { prompt: "Long response", wordLimit: null, rubricHint: "" },
      is_open: false,
      released: false,
      created_by: userId,
    };
  }

  // slide default stub (rarely used directly)
  return createSlidePromptDraft(index, userId, "", "Slide", undefined);
}

function createSlidePromptDraft(
  index: number,
  userId: string,
  imageUrl: string,
  sourcePdf: string,
  page?: number,
  storagePath?: string,
): PromptDraft {
  return {
    id: crypto.randomUUID(),
    slide_index: index,
    kind: "slide",
    prompt_id: undefined,
    content: { imageUrl, sourcePdf, page, storagePath },
    is_open: false,
    released: false,
    created_by: userId,
  };
}

function extractPathFromPublicUrl(url: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/object/public/");
    if (parts.length === 2) {
      const remainder = parts[1];
      const [, ...pathParts] = remainder.split("/");
      return pathParts.join("/");
    }
    return "";
  } catch {
    return "";
  }
}

function playChime(
  ctxRef: React.MutableRefObject<AudioContext | null>,
  freq: number,
) {
  try {
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext || (window as any).webkitAudioContext
        : null;
    if (!Ctx) return;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore audio failures
  }
}
