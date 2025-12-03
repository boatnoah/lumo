"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import LeaveSessionButton from "./leave-button";

type SessionStatus = "draft" | "live" | "ended";
type PromptKind = "mcq" | "short_text" | "long_text" | "slide";

type PromptData = {
  prompt_id: number;
  session_id: number;
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
  join_code: string;
  status: SessionStatus;
  current_prompt: number | null;
};

type ChatMessage = {
  message_id: number;
  body: string;
  user_id: string;
  display_name: string;
  created_at: string;
};

type PresenceUser = { user_id: string; display_name: string };

type Props = {
  session: SessionInfo;
  user: { id: string; name: string };
  initialPrompt: PromptData | null;
};

export default function StudentLiveView({
  session,
  user,
  initialPrompt,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(
    session.status,
  );
  const [currentPrompt, setCurrentPrompt] = useState<PromptData | null>(
    initialPrompt,
  );
  const [isOpen, setIsOpen] = useState<boolean>(initialPrompt?.is_open ?? false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Realtime prompt updates
  useEffect(() => {
    const channel = supabase.channel(`session-live-${session.session_id}`, {
      config: { broadcast: { self: true } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "prompt_changed" }, ({ payload }) => {
        const data = payload as {
          prompt_id: number;
          is_open: boolean;
          slide_index: number;
          kind: PromptKind;
          content: any;
        };
        setCurrentPrompt((prev) => ({
          prompt_id: data.prompt_id,
          session_id: session.session_id,
          slide_index: data.slide_index,
          kind: data.kind,
          content: data.content,
          is_open: data.is_open,
          released: true,
        }));
        setIsOpen(data.is_open);
        setSelectedOption(null);
        setTextAnswer("");
        setSubmitted(false);
      })
      .on("broadcast", { event: "prompt_open_state" }, ({ payload }) => {
        const data = payload as { prompt_id: number; is_open: boolean };
        setIsOpen(data.is_open);
        setCurrentPrompt((prev) =>
          prev && prev.prompt_id === data.prompt_id
            ? { ...prev, is_open: data.is_open }
            : prev,
        );
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session.session_id, supabase]);

  // Presence for participant count
  useEffect(() => {
    const channel = supabase.channel(`session-presence-${session.session_id}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    presenceRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<
          string,
          { display_name: string }[]
        >;
        const people: PresenceUser[] = Object.entries(state).flatMap(
          ([id, metas]) =>
            metas.map((meta) => ({
              user_id: id,
              display_name: meta.display_name || "Student",
            })),
        );
        setPresence(people);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ display_name: user.name });
        }
      });

    return () => {
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
  }, [session.session_id, supabase, user.id, user.name]);

  // Live chat: fetch and subscribe
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("message_id, body, user_id, created_at, profiles(display_name)")
        .eq("session_id", session.session_id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return;
      const normalized =
        data?.map((row: any) => ({
          message_id: row.message_id,
          body: row.body,
          user_id: row.user_id,
          display_name: row.profiles?.display_name || "Student",
          created_at: row.created_at,
        })) ?? [];
      setMessages(normalized);
    };

    loadMessages();

    const channel = supabase
      .channel(`messages-${session.session_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${session.session_id}`,
        },
        (payload) => {
          const row = payload.new as any;
          setMessages((prev) => [
            {
              message_id: row.message_id,
              body: row.body,
              user_id: row.user_id,
              display_name:
                row.profiles?.display_name ||
                prev.find((m) => m.user_id === row.user_id)?.display_name ||
                "Student",
              created_at: row.created_at,
            },
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.session_id, supabase]);

  // Session status updates
  useEffect(() => {
    const channel = supabase
      .channel(`session-status-${session.session_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `session_id=eq.${session.session_id}`,
        },
        (payload) => {
          const record = payload.new as any;
          setSessionStatus(record.status);
          if (record.current_prompt !== currentPrompt?.prompt_id) {
            setCurrentPrompt(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPrompt?.prompt_id, session.session_id, supabase]);

  const participantCount = Math.max(presence.length, 1); // include self

  const handleSubmitAnswer = async () => {
    if (!currentPrompt) {
      toast.error("No active prompt right now.");
      return;
    }
    if (sessionStatus !== "live") {
      toast.error("Session is not live.");
      return;
    }
    if (!isOpen) {
      toast.error("Responses are closed for this prompt.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        prompt_id: currentPrompt.prompt_id,
      };
      if (currentPrompt.kind === "mcq") {
        payload.choice_index = selectedOption;
      } else {
        payload.text_answer = textAnswer.trim();
      }

      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error || "Could not submit.");
        return;
      }
      setSubmitted(true);
      toast.success("Answer submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    const { error } = await supabase.from("messages").insert({
      body: text,
      session_id: session.session_id,
      user_id: user.id,
    });
    if (error) {
      toast.error("Could not send message.");
    }
  };

  const isPromptText = currentPrompt && currentPrompt.kind !== "mcq";

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Live session
            </p>
            <h1 className="text-3xl font-semibold">{session.title}</h1>
            <p className="text-muted-foreground">{session.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Code: {session.join_code}</Badge>
            <Badge
              variant={sessionStatus === "live" ? "default" : "secondary"}
              className="capitalize"
            >
              {sessionStatus}
            </Badge>
            <Badge variant="outline">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
            </Badge>
            <LeaveSessionButton sessionId={session.session_id} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Chat</CardTitle>
              <CardDescription>
                Say hello to classmates. Messages update live.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[520px] flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex -space-x-2">
                  {presence.slice(0, 5).map((p) => (
                    <div
                      key={p.user_id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                    >
                      {p.display_name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground text-xs">
                  {participantCount} online
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border bg-white/70 p-2 dark:bg-slate-900/60">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        msg.user_id === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{msg.display_name}</span>
                        <span className="text-[11px] opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chat" className="text-xs">
                  Message
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="chat"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} type="button">
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">
                {currentPrompt ? `Prompt #${currentPrompt.slide_index + 1}` : "Waiting for a prompt"}
              </CardTitle>
              <CardDescription>
                {currentPrompt
                  ? "Answer below. Updates in real time."
                  : "Your teacher hasn't started yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPrompt ? (
                <>
                  <PromptDisplay prompt={currentPrompt} />
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isOpen ? "default" : "secondary"}>
                        {isOpen ? "Open" : "Closed"}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {isOpen
                          ? "You can submit now."
                          : "Waiting for the teacher to open responses."}
                      </p>
                    </div>
                    {isPromptText ? (
                      <Textarea
                        rows={4}
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Type your response"
                        disabled={!isOpen || submitting}
                      />
                    ) : (
                      <div className="space-y-2">
                        {(currentPrompt.content?.options ?? []).map(
                          (option: string, idx: number) => (
                            <label
                              key={idx}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
                                "hover:border-primary",
                                selectedOption === idx &&
                                  "border-primary bg-primary/5",
                                submitted && "opacity-60"
                              )}
                            >
                              <input
                                type="radio"
                                name="mcq"
                                className="h-4 w-4"
                                checked={selectedOption === idx}
                                onChange={() => setSelectedOption(idx)}
                                disabled={!isOpen || submitting || submitted}
                              />
                              <span>
                                <span className="font-semibold mr-2">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                {option}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleSubmitAnswer}
                      disabled={!isOpen || submitting}
                      disabled={!isOpen || submitting || submitted}
                      >
                        {submitting ? "Submitting..." : "Submit answer"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedOption(null);
                          setTextAnswer("");
                          setSubmitted(false);
                        }}
                        disabled={submitting}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Waiting for your teacher to start.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function PromptDisplay({ prompt }: { prompt: PromptData }) {
  if (prompt.kind === "slide") {
    const imageUrl = prompt.content?.imageUrl;
    return (
      <div className="space-y-2">
        <Badge variant="outline">Slide</Badge>
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
      <div className="space-y-2">
        <Badge variant="outline">Multiple choice</Badge>
        <p className="text-lg font-semibold">
          {prompt.content?.question || "Question"}
        </p>
      </div>
    );
  }

  if (prompt.kind === "short_text") {
    return (
      <div className="space-y-2">
        <Badge variant="outline">Short answer</Badge>
        <p className="text-lg font-semibold">
          {prompt.content?.prompt || "Short answer prompt"}
        </p>
      </div>
    );
  }

  if (prompt.kind === "long_text") {
    return (
      <div className="space-y-2">
        <Badge variant="outline">Long answer</Badge>
        <p className="text-lg font-semibold">
          {prompt.content?.prompt || "Long answer prompt"}
        </p>
        {prompt.content?.rubricHint ? (
          <p className="text-sm text-muted-foreground">
            {prompt.content.rubricHint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      Unsupported prompt type.
    </div>
  );
}
