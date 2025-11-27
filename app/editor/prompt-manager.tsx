"use client";

import { useCallback, useMemo, useState } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { PromptKind, PromptRecord } from "./types";

const promptKindLabels: Record<PromptKind, string> = {
  short_text: "Short response",
  long_text: "Long response",
  mcq: "Multiple choice",
  slide: "Slide or resource",
};

type PromptManagerProps = {
  sessionId: string | number;
  initialPrompts: PromptRecord[];
};

export default function PromptManager({
  sessionId,
  initialPrompts,
}: PromptManagerProps) {
  const [prompts, setPrompts] = useState<PromptRecord[]>(() =>
    [...initialPrompts].sort((a, b) => a.slide_index - b.slide_index),
  );
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptDetail, setNewPromptDetail] = useState("");
  const [newPromptKind, setNewPromptKind] = useState<PromptKind>("short_text");
  const [savingNewPrompt, setSavingNewPrompt] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", ""]);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(0);
  const [slideFile, setSlideFile] = useState<File | null>(null);

  const refreshPrompts = useCallback(async () => {
    const response = await fetch(`/api/prompts?sessionId=${sessionId}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      toast.error(payload.error || "Unable to load prompts");
      return;
    }

    const promptsFromServer = (payload.prompts || []) as PromptRecord[];
    setPrompts(
      promptsFromServer.sort((a, b) => a.slide_index - b.slide_index),
    );
  }, [sessionId]);

  const resetForm = () => {
    setNewPromptTitle("");
    setNewPromptDetail("");
    setMcqOptions(["", ""]);
    setMcqCorrectIndex(0);
    setSlideFile(null);
  };

  const promptCountLabel = useMemo(() => {
    if (!prompts.length) return "No prompts yet";
    if (prompts.length === 1) return "1 prompt";
    return `${prompts.length} prompts`;
  }, [prompts.length]);

  const persistOrder = async (
    nextOrder: PromptRecord[],
    fallback?: PromptRecord[],
  ) => {
    if (!nextOrder.length) return;

    setSavingOrder(true);
    try {
      const response = await fetch("/api/prompts/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          promptIds: nextOrder.map((prompt) => prompt.prompt_id),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save order");
      }
    } catch (error) {
      if (fallback) {
        setPrompts(fallback);
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to save order",
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCreatePrompt = async () => {
    if (newPromptKind === "slide") {
      await handleSlideUpload();
      return;
    }

    if (!newPromptTitle.trim()) {
      toast.error("Add a prompt title before saving.");
      return;
    }

    const baseTitle = newPromptTitle.trim();
    const baseDetail = newPromptDetail.trim() || undefined;

    const requestPayload: Record<string, unknown> = {
      sessionId,
      kind: newPromptKind,
      title: baseTitle,
      detail: baseDetail,
    };

    if (newPromptKind === "mcq") {
      const cleanedOptions = mcqOptions
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);
      if (cleanedOptions.length < 2) {
        toast.error("Add at least two options for your multiple choice.");
        return;
      }

      const validCorrectIndex =
        mcqCorrectIndex >= 0 && mcqCorrectIndex < cleanedOptions.length
          ? mcqCorrectIndex
          : 0;

      requestPayload.question = baseTitle;
      requestPayload.options = cleanedOptions;
      requestPayload.correctOptionIndex = validCorrectIndex;
    }

    setSavingNewPrompt(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to add prompt");
      }

      const createdPrompt = payload.prompt as PromptRecord;
      setPrompts((prev) =>
        [...prev, createdPrompt].sort(
          (a, b) => a.slide_index - b.slide_index,
        ),
      );
      resetForm();
      toast.success("Prompt added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add prompt",
      );
    } finally {
      setSavingNewPrompt(false);
    }
  };

  const handleSlideUpload = async () => {
    if (!slideFile) {
      toast.error("Upload a PDF before saving a slide.");
      return;
    }

    setSavingNewPrompt(true);
    try {
      const formData = new FormData();
      formData.append("sessionId", `${sessionId}`);
      formData.append("file", slideFile);

      if (newPromptTitle.trim()) {
        formData.append("title", newPromptTitle.trim());
      }
      if (newPromptDetail.trim()) {
        formData.append("detail", newPromptDetail.trim());
      }

      const response = await fetch("/api/slides/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload slide");
      }

      await refreshPrompts();
      resetForm();
      toast.success("Slide uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload slide",
      );
    } finally {
      setSavingNewPrompt(false);
    }
  };

  const handleAddOption = () => {
    setMcqOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setMcqOptions((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      if (mcqCorrectIndex >= next.length) {
        setMcqCorrectIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleDeletePrompt = async (promptId: number) => {
    const previousPrompts = prompts;
    const filtered = previousPrompts.filter(
      (prompt) => prompt.prompt_id !== promptId,
    );
    const nextOrder = filtered.map((prompt, index) => ({
      ...prompt,
      slide_index: index + 1,
    }));

    setDeletingId(promptId);
    setPrompts(nextOrder);

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete prompt");
      }

      if (nextOrder.length) {
        await persistOrder(nextOrder, previousPrompts);
      }
      toast.success("Prompt removed");
    } catch (error) {
      setPrompts(previousPrompts);
      toast.error(
        error instanceof Error ? error.message : "Unable to delete prompt",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPrompts((prev) => {
      const oldIndex = prev.findIndex((item) => item.prompt_id === active.id);
      const newIndex = prev.findIndex((item) => item.prompt_id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      const ordered = arrayMove(prev, oldIndex, newIndex).map(
        (prompt, index) => ({
          ...prompt,
          slide_index: index + 1,
        }),
      );

      void persistOrder(ordered, prev);
      return ordered;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a prompt</CardTitle>
          <CardDescription>
            Keep it light: add a title, choose the type, and optional notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
            <div className="space-y-2">
              <Label htmlFor="promptTitle">Prompt title</Label>
              <Input
                id="promptTitle"
                placeholder="e.g. Share one thing you learned today."
                value={newPromptTitle}
                onChange={(event) => setNewPromptTitle(event.target.value)}
                maxLength={140}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promptKind">Type</Label>
              <Select
                value={newPromptKind}
                onValueChange={(value: PromptKind) => {
                  setNewPromptKind(value);
                  if (value !== "mcq") {
                    setMcqCorrectIndex(0);
                  }
                  if (value !== "slide") {
                    setSlideFile(null);
                  }
                  if (value === "mcq" && mcqOptions.length < 2) {
                    setMcqOptions(["", ""]);
                  }
                }}
              >
                <SelectTrigger id="promptKind">
                  <SelectValue placeholder="Prompt type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(promptKindLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptNotes">Notes for students (optional)</Label>
            <Textarea
              id="promptNotes"
              placeholder="Give a quick hint or reminder."
              value={newPromptDetail}
              onChange={(event) => setNewPromptDetail(event.target.value)}
              rows={3}
            />
          </div>

          {newPromptKind === "mcq" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm font-medium">
                  Multiple choice options
                </Label>
                <span className="text-xs text-muted-foreground">
                  Pick one correct answer
                </span>
              </div>
              <div className="space-y-2">
                {mcqOptions.map((option, index) => (
                  <div
                    key={`mcq-option-${index}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="correctOption"
                      className="h-4 w-4 accent-primary"
                      aria-label={`Mark option ${index + 1} as correct`}
                      checked={mcqCorrectIndex === index}
                      onChange={() => setMcqCorrectIndex(index)}
                    />
                    <Input
                      value={option}
                      onChange={(event) => {
                        const value = event.target.value;
                        setMcqOptions((prev) =>
                          prev.map((opt, idx) =>
                            idx === index ? value : opt,
                          ),
                        );
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    {mcqOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove option</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleAddOption}>
                  + Add option
                </Button>
                <p className="text-xs text-muted-foreground">
                  Minimum of two options required.
                </p>
              </div>
            </div>
          )}

          {newPromptKind === "slide" && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <Label htmlFor="slideFile">Upload slide (PDF)</Label>
              <Input
                id="slideFile"
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSlideFile(file ?? null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll create one prompt per page. Titles and notes above are
                applied to the uploaded slides.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleCreatePrompt}
              disabled={savingNewPrompt}
              type="button"
            >
              {savingNewPrompt && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save prompt
            </Button>
            <p className="text-sm text-muted-foreground">{promptCountLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Prompts for this session</CardTitle>
            <CardDescription>
              Drag to reorder. Delete anything you don&apos;t need.
            </CardDescription>
          </div>
          {savingOrder && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving order
            </div>
          )}
        </CardHeader>
        <CardContent>
          {prompts.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
              No prompts yet. Add one above to get started.
            </p>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={prompts.map((prompt) => prompt.prompt_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <SortablePromptCard
                      key={prompt.prompt_id}
                      prompt={prompt}
                      onDelete={() => handleDeletePrompt(prompt.prompt_id)}
                      isDeleting={deletingId === prompt.prompt_id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type SortablePromptCardProps = {
  prompt: PromptRecord;
  onDelete: () => void;
  isDeleting: boolean;
};

function SortablePromptCard({
  prompt,
  onDelete,
  isDeleting,
}: SortablePromptCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prompt.prompt_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = extractPromptTitle(prompt);
  const detail = extractPromptDetail(prompt);
  const content = (prompt.content || {}) as Record<string, unknown>;
  const mcqOptions = Array.isArray(content.options)
    ? (content.options as string[])
    : [];
  const correctIndex =
    typeof content.correctOptionIndex === "number"
      ? (content.correctOptionIndex as number)
      : -1;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-dashed ${isDragging ? "border-primary bg-primary/5 shadow-sm" : ""}`}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <button
          type="button"
          className="text-muted-foreground transition hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{promptKindLabels[prompt.kind]}</Badge>
            <p className="font-medium leading-none">{title}</p>
          </div>
          {detail ? (
            <p className="text-sm text-muted-foreground">{detail}</p>
          ) : null}
          {prompt.kind === "mcq" && mcqOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mcqOptions.map((option, index) => (
                <Badge
                  key={`${prompt.prompt_id}-option-${index}`}
                  variant={index === correctIndex ? "default" : "outline"}
                >
                  {option}
                  {index === correctIndex ? " (correct)" : ""}
                </Badge>
              ))}
            </div>
          )}
          {prompt.kind === "slide" && typeof content.assetName === "string" && (
            <p className="text-xs text-muted-foreground">
              File: {content.assetName}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="sr-only">Delete prompt</span>
        </Button>
      </CardContent>
    </Card>
  );
}

function extractPromptTitle(prompt: PromptRecord) {
  const content = prompt.content || {};
  const title =
    typeof content.title === "string" && content.title.trim().length
      ? content.title
      : typeof content.question === "string" && content.question.trim().length
        ? content.question
        : typeof content.prompt === "string" && content.prompt.trim().length
          ? content.prompt
          : null;

  return title || "Untitled prompt";
}

function extractPromptDetail(prompt: PromptRecord) {
  const content = prompt.content || {};
  if (typeof content.detail === "string" && content.detail.trim().length) {
    return content.detail;
  }
  if (typeof content.prompt === "string" && content.prompt.trim().length) {
    return content.prompt;
  }
  return null;
}
