import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  GripVertical,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

type EditorPageProps = {
  searchParams?: Promise<{
    sessionId?: string;
  }>;
};

const mockSlides = [
  {
    id: "slide-1",
    title: "Welcome Warm-Up",
    subtitle: "2 prompts",
    thumbText: "1",
  },
  {
    id: "slide-2",
    title: "Mini Lecture",
    subtitle: "Add notes",
    thumbText: "2",
  },
  {
    id: "slide-3",
    title: "Exit Ticket",
    subtitle: "MCQ + Short answer",
    thumbText: "3",
  },
];

const mockPrompts = [
  {
    id: "prompt-1",
    kind: "Multiple choice",
    title: "How confident do you feel right now?",
    detail: "Give me a quick read on how ready you are to practice.",
    badge: "Draft",
  },
  {
    id: "prompt-2",
    kind: "Short response",
    title: "In one sentence, explain Newton's 2nd law.",
    detail: "Students will type into a text box; perfect for open reflection.",
    badge: "Scheduled",
  },
];

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const sessionIdParam = resolvedParams?.sessionId;
  if (!sessionIdParam) {
    console.log("bruh");
    redirect("/dashboard");
  }
  const sessionIdFilter = Number.isNaN(Number(sessionIdParam))
    ? sessionIdParam
    : Number(sessionIdParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("session_id, title, status, join_code")
    .eq("session_id", sessionIdFilter)
    .maybeSingle();

  if (!session) {
    redirect("/dashboard");
  }

  const activeSlide = mockSlides[0];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Session</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {session?.title || "Untitled session"}
            </h1>
            <Badge variant="secondary" className="text-xs">
              {session?.status ?? "draft"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Session #{sessionIdParam} · Join code{" "}
            {session?.join_code ?? "------"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Save draft
          </Button>
          <Button size="sm">Present</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-col border-r bg-background/95 p-4 md:flex">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Deck</p>
              <p className="text-sm font-medium">Slides & prompts</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add prompt</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Add slide</DropdownMenuItem>
                <DropdownMenuItem>Add multiple choice</DropdownMenuItem>
                <DropdownMenuItem>Add free response</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            {mockSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border bg-muted px-3 py-2 text-left text-sm transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex h-12 w-16 items-center justify-center rounded-md bg-background font-semibold text-muted-foreground">
                  {slide.thumbText}
                </div>
                <div className="flex flex-1 flex-col truncate">
                  <span className="font-medium">
                    {index + 1}. {slide.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {slide.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
            <section>
              <div className="flex items-center justify-between pb-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Current slide
                  </p>
                  <h2 className="text-lg font-semibold">{activeSlide.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Previous slide</span>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Next slide</span>
                  </Button>
                  <Button variant="outline" size="sm">
                    Replace image
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="aspect-video w-full rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
                  <div className="flex h-full items-center justify-center text-sm">
                    Slide preview goes here
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Slide 1 of {mockSlides.length} · Uploaded moments ago
                  </span>
                  <span>Drag the thumbnail to reorder</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase text-muted-foreground">
                  Prompts attached to this slide
                </h3>
                <Button variant="outline" size="sm">
                  Add prompt
                </Button>
              </div>
              <div className="space-y-4">
                {mockPrompts.map((prompt) => (
                  <Card key={prompt.id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {prompt.kind}
                        </CardTitle>
                        <CardDescription>{prompt.title}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{prompt.badge}</Badge>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Prompt actions</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {prompt.detail}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Edit prompt
                        </Button>
                        <Button variant="secondary" size="sm">
                          Release to students
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </main>

        <aside className="hidden w-80 flex-col border-l bg-background px-6 py-6 lg:flex">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Session details</h4>
              <Badge variant="secondary">Teacher view</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage who can join, release prompts, and keep tabs on how this
              lesson is going.
            </p>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Join code</span>
                <strong>{session?.join_code ?? "------"}</strong>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-medium capitalize">
                  {session?.status ?? "draft"}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-8 space-y-3">
            <h4 className="text-sm font-semibold">Insert</h4>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New slide
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Bookmark className="mr-2 h-4 w-4" />
                Multiple choice
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Free response
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
