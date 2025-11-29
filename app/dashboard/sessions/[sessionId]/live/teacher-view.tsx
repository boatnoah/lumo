"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SessionStatus = "draft" | "live" | "ended";
type PromptKind = "mcq" | "short_text" | "long_text" | "slide";
type AnswerRow = {
  answer_id: number;
  user_id: string;
  prompt_id: number;
  choice_index: number | null;
  text_answer: string | null;
  created_at: string;
  display_name: string;
};

type PromptRow = {
  prompt_id: number;
  slide_index: number;
  kind: PromptKind;
  content: any;
  is_open: boolean;
  released: boolean;
};

type SessionInfo = {
  session_id: number;
  title: string;
  description: string;
  status: SessionStatus;
  join_code: string;
  current_prompt: number | null;
};

type BroadcastEvent =
  | {
      event: "prompt_changed";
      payload: {
        prompt_id: number;
        is_open: boolean;
        slide_index: number;
        kind: PromptKind;
        content: any;
      };
    }
  | {
      event: "prompt_open_state";
      payload: {
        prompt_id: number;
        is_open: boolean;
      };
    };

export default function LiveTeacherView({
  session,
  prompts: initialPrompts,
}: {
  session: SessionInfo;
  prompts: PromptRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [prompts, setPrompts] = useState<PromptRow[]>(initialPrompts);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(
    session.current_prompt ?? initialPrompts[0]?.prompt_id ?? null,
  );
  const [currentPromptId, setCurrentPromptId] = useState<number | null>(
    session.current_prompt ?? null,
  );
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(
    session.status,
  );
  const [channelReady, setChannelReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const profileCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const channel = supabase.channel(`session-live-${session.session_id}`, {
      config: {
        broadcast: { self: true },
      },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "prompt_changed" }, ({ payload }) => {
        const data = payload as BroadcastEvent["payload"];
        setCurrentPromptId(data.prompt_id);
        setPrompts((prev) =>
          prev.map((p) =>
            p.prompt_id === data.prompt_id
              ? {
                  ...p,
                  is_open: data.is_open,
                  content: data.content ?? p.content,
                }
              : p,
          ),
        );
      })
      .on("broadcast", { event: "prompt_open_state" }, ({ payload }) => {
        const data = payload as BroadcastEvent["payload"];
        setPrompts((prev) =>
          prev.map((p) =>
            p.prompt_id === data.prompt_id ? { ...p, is_open: data.is_open } : p,
          ),
        );
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setChannelReady(true);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session.session_id, supabase]);

  const selectedPrompt =
    prompts.find((p) => p.prompt_id === selectedPromptId) ?? null;
  const currentPrompt =
    prompts.find((p) => p.prompt_id === currentPromptId) ?? null;

  useEffect(() => {
    if (!currentPromptId) {
      setAnswers([]);
      return;
    }
    fetchAnswers(currentPromptId);
  }, [currentPromptId]);

  useEffect(() => {
    if (!currentPromptId) return;
    const channel = supabase
      .channel(`answers-${session.session_id}-${currentPromptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `prompt_id=eq.${currentPromptId}`,
        },
        async (payload) => {
          const record = (payload.new || payload.old) as any;
          if (!record?.answer_id) return;
          // Find a display name if we have it cached; otherwise fetch once.
          let display_name =
            profileCacheRef.current[record.user_id] || "Student";
          if (display_name === "Student") {
            const { data } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", record.user_id)
              .maybeSingle();
            if (data?.display_name) {
              display_name = data.display_name;
              profileCacheRef.current[record.user_id] = display_name;
            }
          }

          setAnswers((prev) => {
            const existingIndex = prev.findIndex(
              (a) => a.answer_id === record.answer_id,
            );
            const nextAnswer = {
              answer_id: record.answer_id,
              user_id: record.user_id,
              prompt_id: record.prompt_id,
              choice_index: record.choice_index,
              text_answer: record.text_answer,
              created_at: record.created_at,
              display_name,
            };

            if (payload.eventType === "DELETE") {
              if (existingIndex === -1) return prev;
              const copy = [...prev];
              copy.splice(existingIndex, 1);
              return copy;
            }

            if (existingIndex !== -1) {
              const copy = [...prev];
              copy[existingIndex] = nextAnswer;
              return copy;
            }

            return [nextAnswer, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPromptId, session.session_id, supabase]);

  const fetchAnswers = async (promptId: number) => {
    setAnswersLoading(true);
    try {
      const { data, error } = await supabase
        .from("answers")
        .select(
          "answer_id, user_id, prompt_id, choice_index, text_answer, created_at, profiles!inner(display_name)",
        )
        .eq("prompt_id", promptId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const normalized =
        data?.map((row: any) => {
          const displayName = row.profiles?.display_name || "Student";
          profileCacheRef.current[row.user_id] = displayName;
          return {
            answer_id: row.answer_id,
            user_id: row.user_id,
            prompt_id: row.prompt_id,
            choice_index: row.choice_index,
            text_answer: row.text_answer,
            created_at: row.created_at,
            display_name: displayName,
          };
        }) ?? [];
      setAnswers(normalized);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load answers.",
      );
    } finally {
      setAnswersLoading(false);
    }
  };

  const broadcast = async (event: BroadcastEvent) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.send({
      type: "broadcast",
      event: event.event,
      payload: event.payload,
    });
  };

  const handleSetCurrent = async () => {
    if (!selectedPrompt) {
      toast.error("Select a prompt to show.");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sessions/${session.session_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "live",
          current_prompt: selectedPrompt.prompt_id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Could not set current prompt.");
        return;
      }
      setCurrentPromptId(selectedPrompt.prompt_id);
      setSessionStatus("live");
      fetchAnswers(selectedPrompt.prompt_id);
      await broadcast({
        event: "prompt_changed",
        payload: {
          prompt_id: selectedPrompt.prompt_id,
          is_open: selectedPrompt.is_open,
          slide_index: selectedPrompt.slide_index,
          kind: selectedPrompt.kind,
          content: selectedPrompt.content,
        },
      });
      toast.success("Showing to students.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not set current prompt.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleOpen = async (next: boolean) => {
    if (!currentPrompt) {
      toast.error("Set a current prompt first.");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(
        `/api/sessions/${session.session_id}/prompts/${currentPrompt.prompt_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_open: next, released: true }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Could not update prompt state.");
        return;
      }

      setPrompts((prev) =>
        prev.map((p) =>
          p.prompt_id === currentPrompt.prompt_id
            ? { ...p, is_open: next, released: true }
            : p,
        ),
      );

      await broadcast({
        event: "prompt_open_state",
        payload: { prompt_id: currentPrompt.prompt_id, is_open: next },
      });
      toast.success(next ? "Responses opened." : "Responses closed.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update prompt state.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEndSession = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sessions/${session.session_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended", current_prompt: null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Could not end session.");
        return;
      }
      setSessionStatus("ended");
      setCurrentPromptId(null);
      setPrompts((prev) => prev.map((p) => ({ ...p, is_open: false })));
      toast.success("Session ended.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not end session.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Teacher live room
            </p>
            <h1 className="text-3xl font-semibold">{session.title}</h1>
            <p className="text-muted-foreground">{session.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Code: {session.join_code}
            </Badge>
            <Badge
              variant={sessionStatus === "live" ? "default" : "secondary"}
              className="capitalize"
            >
              {sessionStatus}
            </Badge>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/sessions/${session.session_id}/edit`}>
                Edit session
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndSession}
              disabled={isUpdating || sessionStatus === "ended"}
            >
              End session
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Prompts</CardTitle>
              <Badge variant={channelReady ? "default" : "secondary"}>
                {channelReady ? "Realtime on" : "Connecting"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {prompts.length === 0 ? (
                <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No prompts yet. Add some in the editor.
                </div>
              ) : (
                <div className="space-y-2">
                  {prompts.map((prompt) => {
                    const isCurrent = prompt.prompt_id === currentPromptId;
                    const isSelected = prompt.prompt_id === selectedPromptId;
                    return (
                      <button
                        key={prompt.prompt_id}
                        onClick={() => setSelectedPromptId(prompt.prompt_id)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left transition",
                          "hover:border-primary hover:bg-primary/5",
                          isSelected && "border-primary bg-primary/5",
                          isCurrent && "ring-1 ring-primary",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              #{prompt.slide_index + 1}
                            </Badge>
                            <span className="text-sm font-semibold capitalize">
                              {prompt.kind.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {prompt.is_open ? (
                              <Badge variant="default">Open</Badge>
                            ) : (
                              <Badge variant="secondary">Closed</Badge>
                            )}
                            {isCurrent ? (
                              <Badge variant="outline">Current</Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedPrompt ? "Selected prompt" : "Pick a prompt"}
              </CardTitle>
              <CardDescription>
                Show a prompt to students and control whether responses are open.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPrompt ? (
                <>
                  <PromptPreview prompt={selectedPrompt} />
                  <Separator />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={handleSetCurrent}
                      disabled={isUpdating || !channelReady}
                    >
                      {isUpdating ? "Updating..." : "Show to students"}
                    </Button>
                    <Button
                      variant={currentPrompt?.is_open ? "secondary" : "outline"}
                      onClick={() =>
                        handleToggleOpen(!(currentPrompt?.is_open ?? false))
                      }
                      disabled={
                        !currentPrompt ||
                        isUpdating ||
                        !channelReady ||
                        sessionStatus !== "live"
                      }
                    >
                      {currentPrompt?.is_open
                        ? "Close responses"
                        : "Open responses"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current prompt:{" "}
                    {currentPrompt
                      ? `#${currentPrompt.slide_index + 1}`
                      : "None"}
                    . Responses: {currentPrompt?.is_open ? "open" : "closed"}.
                  </p>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Answers</p>
                      {currentPrompt ? (
                        <Badge variant="outline">
                          {answers.length} response{answers.length === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                    <AnswersList answers={answers} loading={answersLoading} />
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Select a prompt from the list to control it.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function PromptPreview({ prompt }: { prompt: PromptRow }) {
  if (prompt.kind === "slide") {
    const imageUrl = prompt.content?.imageUrl;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Slide</Badge>
          <span className="text-sm text-muted-foreground">
            #{prompt.slide_index + 1}
          </span>
        </div>
        {imageUrl ? (
          <div className="overflow-hidden rounded-lg border bg-muted/40">
            <img
              src={imageUrl}
              alt={`Slide ${prompt.slide_index + 1}`}
              className="w-full"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No slide image available.
          </p>
        )}
      </div>
    );
  }

  if (prompt.kind === "mcq") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">MCQ</Badge>
          <span className="text-sm text-muted-foreground">
            #{prompt.slide_index + 1}
          </span>
        </div>
        <p className="text-lg font-semibold">
          {prompt.content?.question || "Question"}
        </p>
        <ul className="space-y-2">
          {(prompt.content?.options ?? []).map(
            (option: string, idx: number) => (
              <li
                key={idx}
                className="rounded-md border px-3 py-2 text-sm text-muted-foreground"
              >
                {String.fromCharCode(65 + idx)}. {option}
              </li>
            ),
          )}
        </ul>
      </div>
    );
  }

  if (prompt.kind === "short_text") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Short answer</Badge>
          <span className="text-sm text-muted-foreground">
            #{prompt.slide_index + 1}
          </span>
        </div>
        <p className="text-lg font-semibold">
          {prompt.content?.prompt || "Short answer prompt"}
        </p>
      </div>
    );
  }

  if (prompt.kind === "long_text") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Long answer</Badge>
          <span className="text-sm text-muted-foreground">
            #{prompt.slide_index + 1}
          </span>
        </div>
        <p className="text-lg font-semibold">
          {prompt.content?.prompt || "Long answer prompt"}
        </p>
        {prompt.content?.rubricHint ? (
          <p className="text-sm text-muted-foreground">
            Hint: {prompt.content.rubricHint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
      Unsupported prompt type.
    </div>
  );
}

function AnswersList({
  answers,
  loading,
}: {
  answers: AnswerRow[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
        Loading answers...
      </div>
    );
  }

  if (!answers.length) {
    return (
      <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        No answers yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-auto pr-1">
      {answers.map((answer) => (
        <div
          key={answer.answer_id}
          className="rounded-md border bg-white/70 px-3 py-2 text-sm shadow-sm dark:bg-slate-900/60"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{answer.display_name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(answer.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {answer.text_answer ? (
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
              {answer.text_answer}
            </p>
          ) : answer.choice_index !== null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Chose option {answer.choice_index + 1}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No answer text</p>
          )}
        </div>
      ))}
    </div>
  );
}
