"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  LongTextContent,
  McqContent,
  PromptContent,
  PromptKind,
  ShortTextContent,
  SlideContent,
} from "@/types/prompts";

type SessionStatus = "draft" | "live" | "ended";

export type TeacherSessionInfo = {
  session_id: number;
  title: string;
  description: string;
  join_code: string;
};

export type TeacherPromptRow = {
  prompt_id: number;
  slide_index: number;
  kind: PromptKind;
  content: PromptContent;
  is_open: boolean;
  released: boolean;
};

export type TeacherAnswerRow = {
  answer_id: number;
  user_id: string;
  prompt_id: number;
  choice_index: number | null;
  text_answer: string | null;
  created_at: string;
  display_name: string;
};

export type TeacherChatMessage = {
  message_id: number;
  body: string;
  user_id: string;
  display_name: string;
  avatar: string | null;
  created_at: string;
};

type TeacherLiveViewProps = {
  session: TeacherSessionInfo;
  sessionStatus: SessionStatus;
  channelReady: boolean;
  prompts: TeacherPromptRow[];
  selectedPromptId: number | null;
  currentPromptId: number | null;
  selectedPrompt: TeacherPromptRow | null;
  currentPrompt: TeacherPromptRow | null;
  answers: TeacherAnswerRow[];
  answersLoading: boolean;
  messages: TeacherChatMessage[];
  chatInput: string;
  onSelectPrompt?: (promptId: number) => void;
  onSetCurrent?: () => void;
  onToggleOpen?: (next: boolean) => void;
  onEndSession?: () => void;
  onChatInputChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onSendMessage?: () => void;
  editSessionHref?: string;
  isUpdating?: boolean;
  readOnly?: boolean;
  className?: string;
  demoTargetPrefix?: string;
};

export function TeacherLiveView({
  session,
  sessionStatus,
  channelReady,
  prompts,
  selectedPromptId,
  currentPromptId,
  selectedPrompt,
  currentPrompt,
  answers,
  answersLoading,
  messages,
  chatInput,
  onSelectPrompt,
  onSetCurrent,
  onToggleOpen,
  onEndSession,
  onChatInputChange,
  onSendMessage,
  editSessionHref,
  isUpdating = false,
  readOnly = false,
  className,
  demoTargetPrefix,
}: TeacherLiveViewProps) {
  const getDemoTarget = (name: string) =>
    demoTargetPrefix ? `${demoTargetPrefix}-${name}` : undefined;

  return (
    <div className={cn("min-h-screen bg-muted/30 px-4 py-10", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-info">Teacher live room</p>
            <h1 className="text-3xl font-medium">{session.title}</h1>
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
            {editSessionHref ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={editSessionHref}>Edit session</Link>
              </Button>
            ) : null}
            {!readOnly ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onEndSession}
                disabled={isUpdating || sessionStatus === "ended"}
              >
                End session
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px,1fr,320px]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
                  {prompts.map((prompt) => {
                    const isCurrent = prompt.prompt_id === currentPromptId;
                    const isSelected = prompt.prompt_id === selectedPromptId;
                    return (
                      <button
                        key={prompt.prompt_id}
                        type="button"
                        onClick={() => onSelectPrompt?.(prompt.prompt_id)}
                        disabled={!onSelectPrompt}
                        data-demo-target={getDemoTarget(`prompt-${prompt.prompt_id}`)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left transition",
                          "hover:border-primary hover:bg-primary/5",
                          isSelected && "border-primary bg-primary/5",
                          isCurrent && "ring-1 ring-primary",
                          !onSelectPrompt && "cursor-default",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{prompt.slide_index + 1}</Badge>
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
                            {isCurrent ? <Badge variant="outline">Current</Badge> : null}
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
                      onClick={onSetCurrent}
                      disabled={readOnly || isUpdating || !channelReady}
                      data-demo-target={getDemoTarget("show-button")}
                    >
                      {isUpdating ? "Updating..." : "Show to students"}
                    </Button>
                    <Button
                      variant={currentPrompt?.is_open ? "secondary" : "outline"}
                      onClick={() => onToggleOpen?.(!(currentPrompt?.is_open ?? false))}
                      data-demo-target={getDemoTarget("open-button")}
                      disabled={
                        readOnly ||
                        !currentPrompt ||
                        isUpdating ||
                        !channelReady ||
                        sessionStatus !== "live"
                      }
                    >
                      {currentPrompt?.is_open ? "Close responses" : "Open responses"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current prompt: {currentPrompt ? `#${currentPrompt.slide_index + 1}` : "None"}. Responses: {currentPrompt?.is_open ? "open" : "closed"}.
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
                    <div data-demo-target={getDemoTarget("answers-panel")}>
                      <AnswersList answers={answers} loading={answersLoading} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Select a prompt from the list to control it.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Chat</CardTitle>
              <CardDescription>Communicate with students in real-time.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[600px] flex-col gap-3">
              <div
                className="flex-1 space-y-2 overflow-y-auto rounded-lg border bg-card/70 p-2"
                data-demo-target={getDemoTarget("chat-panel")}
              >
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {msg.avatar ? (
                          <AvatarImage src={msg.avatar} alt={msg.display_name} />
                        ) : (
                          <AvatarFallback>
                            {msg.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{msg.display_name}</span>
                          <span className="text-[11px] opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words">{msg.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-chat" className="text-xs">
                  Message
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="teacher-chat"
                    value={chatInput}
                    onChange={onChatInputChange}
                    placeholder="Type a message"
                    disabled={readOnly || !onChatInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSendMessage?.();
                      }
                    }}
                  />
                  <Button onClick={onSendMessage} type="button" disabled={readOnly || !onSendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PromptPreview({ prompt }: { prompt: TeacherPromptRow }) {
  if (prompt.kind === "slide") {
    const imageUrl = (prompt.content as SlideContent | undefined)?.imageUrl;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Slide</Badge>
          <span className="text-sm text-muted-foreground">#{prompt.slide_index + 1}</span>
        </div>
        {imageUrl ? (
          <div className="overflow-hidden rounded-lg border bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`Slide ${prompt.slide_index + 1}`} className="w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No slide image available.</p>
        )}
      </div>
    );
  }

  if (prompt.kind === "mcq") {
    const content = prompt.content as McqContent;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">MCQ</Badge>
          <span className="text-sm text-muted-foreground">#{prompt.slide_index + 1}</span>
        </div>
        <p className="text-lg font-semibold">{content.question || "Question"}</p>
        <ul className="space-y-2">
          {(content.options ?? []).map((option: string, idx: number) => (
            <li key={idx} className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {String.fromCharCode(65 + idx)}. {option}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (prompt.kind === "short_text") {
    const content = prompt.content as ShortTextContent;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Short answer</Badge>
          <span className="text-sm text-muted-foreground">#{prompt.slide_index + 1}</span>
        </div>
        <p className="text-lg font-semibold">{content.prompt || "Short answer prompt"}</p>
      </div>
    );
  }

  if (prompt.kind === "long_text") {
    const content = prompt.content as LongTextContent;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Long answer</Badge>
          <span className="text-sm text-muted-foreground">#{prompt.slide_index + 1}</span>
        </div>
        <p className="text-lg font-semibold">{content.prompt || "Long answer prompt"}</p>
        {content.rubricHint ? (
          <p className="text-sm text-muted-foreground">Hint: {content.rubricHint}</p>
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
  answers: TeacherAnswerRow[];
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
    <div className="max-h-80 space-y-2 overflow-auto pr-1">
      {answers.map((answer) => (
        <div
          key={answer.answer_id}
          className="rounded-md border bg-card/70 px-3 py-2 text-sm shadow-sm"
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
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
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
