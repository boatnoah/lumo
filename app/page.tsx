import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  ChartLine,
  CheckCircle2,
  Flame,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const howLumoHelps = [
  {
    icon: Activity,
    title: "Real-time engagement",
    description:
      "Launch polls, quizzes, debates, and reflections on the fly to keep every student active.",
  },
  {
    icon: Brain,
    title: "AI-powered insights",
    description:
      "Summaries surface misconceptions, suggest follow-up questions, and spotlight what to reteach.",
  },
  {
    icon: Users,
    title: "Equity & inclusivity",
    description:
      "Track who’s contributing, who’s quiet, and balance participation with anonymous options.",
  },
  {
    icon: Flame,
    title: "Gamified participation",
    description:
      "Streaks, contribution points, and badges keep learners motivated without feeling high-stakes.",
  },
];

const teacherBullets = [
  "Build interactive slides and activities in seconds.",
  "Monitor live responses and engagement as you teach.",
  "Let AI propose follow-up questions based on the room.",
  "Save insights to refine tomorrow’s lesson.",
];

const studentBullets = [
  "Join from any device in a few taps.",
  "Participate anonymously to lower anxiety.",
  "React, vote, and answer in real time.",
  "Earn streaks and badges for steady participation.",
];

const whyNow = [
  "Hybrid and blended classrooms demand live feedback loops.",
  "Students expect interactive, app-like experiences in class.",
  "Teachers need fast, actionable insights—not spreadsheets.",
];

const testimonials = [
  {
    quote:
      "Lumo turned my lectures into conversations. Engagement jumped immediately.",
    name: "Cole Hartman",
    title: "Code Coach",
  },
  {
    quote:
      "I feel heard without feeling called out. The anonymous mode is a game changer.",
    name: "Deep Patel",
    title: "Undergraduate Student",
  },
  {
    quote:
      "We finally see participation gaps in real time. It’s become part of our equity toolkit.",
    name: "Boss Bandit",
    title: "Classroom Teacher at Clash Royale High School",
  },
];

const metrics = [
  { label: "Responses captured", value: "38k+" },
  { label: "Avg. engagement lift", value: "27%" },
  { label: "Schools piloting", value: "120+" },
];

const steps = [
  {
    step: "01",
    title: "Create your session",
    description: "Import slides or start from a blank canvas in under a minute.",
  },
  {
    step: "02",
    title: "Share the join code",
    description: "Students join on any device—no accounts or installs needed.",
  },
  {
    step: "03",
    title: "Teach in live view",
    description:
      "Watch responses, AI summaries, and participation heatmaps update in real time.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  const primaryCtaHref = isAuthed ? "/dashboard" : "/auth/sign-up";
  const secondaryCtaHref = isAuthed ? "/dashboard" : "/auth/login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-foreground">
      {/* layered background */}
      <div className="pointer-events-none absolute inset-0 -z-20">
        {/* soft radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        {/* accent blobs */}
        <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(15,23,42,0.9),_rgba(15,23,42,1))]" />
        {/* subtle grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />
        {/* top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_65%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* NAV */}
        <nav className="sticky top-4 z-20 flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-5 py-3 shadow-lg shadow-emerald-500/15 backdrop-blur">
          <div className="flex items-center gap-3 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-300 text-black shadow-lg shadow-emerald-400/40">
              L
            </span>
            <div className="leading-tight">
              <p className="text-lg">Lumo</p>
              <p className="text-xs text-muted-foreground">
                Light up engagement
              </p>
            </div>
            <Badge className="ml-2 hidden md:inline-flex" variant="outline">
              Classroom engagement platform
            </Badge>
          </div>

          <div className="hidden items-center gap-6 text-xs font-medium text-muted-foreground sm:flex">
            <Link
              href="#how-it-works"
              className="relative pb-0.5 hover:text-emerald-300"
            >
              <span>Features</span>
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-emerald-400 to-cyan-300 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <Link
              href="#analytics"
              className="relative pb-0.5 hover:text-emerald-300"
            >
              Analytics
            </Link>
            <Link
              href="#proof"
              className="relative pb-0.5 hover:text-emerald-300"
            >
              Proof
            </Link>
            <Link
              href="#cta"
              className="relative pb-0.5 text-emerald-200 hover:text-emerald-300"
            >
              Get started
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {isAuthed ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/sign-up">Get started</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>

        {/* HERO */}
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <Badge
              variant="outline"
              className="border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
            >
              Light up engagement in every classroom.
            </Badge>

            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Bring classrooms to life — instantly.
              </h1>
              <p className="text-lg text-muted-foreground lg:text-xl">
                Lumo turns everyday lessons into rich, interactive learning
                experiences powered by live engagement and AI insights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="group relative overflow-hidden">
                <Link href={primaryCtaHref}>
                  <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.4),transparent)] opacity-60 transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="relative flex items-center">
                    {isAuthed ? "Go to dashboard" : "Get started"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={secondaryCtaHref}>
                  {isAuthed ? "Open dashboard" : "Log in"}
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Built for teachers, loved by students.
              </div>
            </div>

            {/* mini benefits row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-white/10 bg-white/[0.04] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:border-emerald-400/60">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    Live, interactive sessions
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Launch polls, quizzes, debates, and reflections without
                    breaking your lesson flow.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-white/10 bg-white/[0.04] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:border-emerald-400/60">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    AI insights on-demand
                  </CardTitle>
                  <CardDescription className="text-sm">
                    See comprehension in real time, flag misconceptions, and get
                    suggested follow-ups.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* scroll indicator */}
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-7 w-[1px] bg-gradient-to-b from-transparent via-slate-500/60 to-transparent" />
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-sm shadow-emerald-500/20 backdrop-blur hover:border-emerald-400/60"
              >
                <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                <span>Scroll to see how Lumo works</span>
              </Link>
            </div>
          </div>

          {/* HERO RIGHT: live session preview */}
          <div className="relative">
            <div className="absolute -left-10 -top-10 h-48 w-48 animate-pulse rounded-full bg-emerald-500/30 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-40 animate-pulse rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-emerald-500/25 transition-transform duration-500 hover:-translate-y-1.5 hover:shadow-emerald-400/40">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-200">
                      <Rocket className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Live Session
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        “Ecosystems in Motion”
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-400/50">
                    Live pulse
                  </Badge>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Participation
                    </p>
                    <span className="text-xs font-semibold text-emerald-300">
                      87% active
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 w-[87%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border-white/10 bg-black/40">
                      <CardContent className="space-y-2 p-4">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          AI summary
                        </p>
                        <p className="text-xs text-foreground">
                          Most students grasp energy flow; confusion around
                          decomposers. Suggest a quick cold-call poll.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-black/40">
                      <CardContent className="space-y-2 p-4">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Follow-up prompt
                        </p>
                        <p className="text-xs text-foreground">
                          “Name one organism that recycles nutrients in this
                          system.”
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* stacked stat chip */}
              <div className="flex flex-wrap gap-3">
                <Card className="flex-1 min-w-[140px] border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs shadow-md shadow-emerald-500/25">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-200">
                    Today&apos;s check-ins
                  </p>
                  <p className="text-lg font-semibold text-emerald-100">
                    612 responses
                  </p>
                  <p className="text-[11px] text-emerald-100/70">
                    Students answered in under 90 seconds.
                  </p>
                </Card>
                <Card className="flex-1 min-w-[140px] border-white/10 bg-white/5 px-4 py-3 text-xs">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Misconceptions flagged
                  </p>
                  <p className="text-lg font-semibold text-foreground">14</p>
                  <p className="text-[11px] text-muted-foreground">
                    Auto-grouped for tomorrow&apos;s warm-up.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS STRIP */}
        <section className="rounded-3xl border border-white/5 bg-black/50 px-6 py-5 shadow-lg shadow-emerald-500/15 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span>Trusted by classrooms from K-12 through higher-ed.</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="space-y-0.5 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-base font-semibold text-emerald-100">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUICK STEPS */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-8 shadow-lg shadow-emerald-500/10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
                Get started in minutes
              </p>
              <h2 className="text-xl font-semibold sm:text-2xl">
                From blank screen to live session in three steps.
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <Card
                key={item.step}
                className="group border-white/10 bg-black/40 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <CardContent className="space-y-2 p-5">
                  <p className="text-xs font-mono text-emerald-300">
                    {item.step}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* HOW LUMO HELPS */}
        <section id="how-it-works" className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
                How Lumo helps
              </p>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Built for live, inclusive classrooms.
              </h2>
              <p className="text-muted-foreground">
                K–12 and higher-ed teachers use Lumo to keep every voice in the
                room.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={secondaryCtaHref}>
                {isAuthed ? "Open dashboard" : "Log in"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {howLumoHelps.map((feature) => (
              <Card
                key={feature.title}
                className="border-white/10 bg-white/[0.03] backdrop-blur transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* TEACHER EXPERIENCE */}
        <section className="grid gap-10 rounded-3xl border border-white/10 bg-black/60 px-8 py-10 shadow-xl shadow-emerald-500/15 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
              Teacher experience
            </p>
            <h3 className="text-3xl font-semibold sm:text-4xl">
              Teach smarter. Respond faster.
            </h3>
            <p className="text-muted-foreground">
              Build activities in seconds, see comprehension live, and let AI
              guide next steps—without losing the room.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {teacherBullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-lg shadow-emerald-500/10">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/15 blur-2xl" />
            <div className="absolute right-4 top-10 h-16 w-16 rounded-full bg-cyan-400/15 blur-xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Live responses
                </p>
                <p className="text-2xl font-semibold text-foreground">32/36</p>
              </div>
              <Badge variant="outline" className="border-white/20">
                Engagement high
              </Badge>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Confident</span>
                <span className="text-emerald-300">62%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 w-[62%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Unsure</span>
                <span className="text-yellow-200">28%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 w-[28%] rounded-full bg-gradient-to-r from-yellow-300 to-amber-400" />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Stuck</span>
                <span className="text-red-200">10%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 w-[10%] rounded-full bg-gradient-to-r from-rose-400 to-red-400" />
              </div>
            </div>
          </div>
        </section>

        {/* STUDENT EXPERIENCE */}
        <section className="grid gap-10 rounded-3xl border border-white/10 bg-white/[0.02] px-8 py-10 shadow-xl shadow-emerald-500/10 lg:grid-cols-2 lg:items-center">
          <div className="relative order-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-lg shadow-emerald-500/10 lg:order-1">
            <div className="absolute left-6 top-6 h-16 w-16 rounded-full bg-emerald-500/15 blur-xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Student view</p>
                <p className="text-lg font-semibold text-foreground">
                  Join code: 7LUMO
                </p>
              </div>
              <Badge variant="outline" className="border-white/20">
                Anonymity on
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              <Card className="border-white/10 bg-black/40">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      “How do decomposers help ecosystems?”
                    </p>
                    <Badge variant="secondary" className="bg-emerald-500/15">
                      Live
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Sending response...
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Reaction badges, streaks, and points reward consistent
                participation.
              </div>
            </div>
          </div>
          <div className="order-1 space-y-4 lg:order-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
              Student experience
            </p>
            <h3 className="text-3xl font-semibold sm:text-4xl">
              Participation that actually feels good.
            </h3>
            <p className="text-muted-foreground">
              Lower anxiety with anonymous options, reward steady participation,
              and make feedback instant—on any device.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {studentBullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ANALYTICS */}
        <section
          id="analytics"
          className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-600/15 via-slate-900 to-cyan-600/10 px-8 py-12 shadow-xl shadow-emerald-500/15"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
                Analytics + AI
              </p>
              <h3 className="text-3xl font-semibold sm:text-4xl">
                Know what your class is thinking — instantly.
              </h3>
              <p className="text-muted-foreground">
                Live charts, AI summaries, and participation heatmaps keep you
                ahead of misconceptions as they surface.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-white/10 bg-black/40">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Engagement score
                    </p>
                    <ChartLine className="h-5 w-5 text-emerald-300" />
                  </div>
                  <p className="text-3xl font-semibold text-foreground">92</p>
                  <p className="text-sm text-muted-foreground">
                    Consistent participation across the session.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-black/40">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      AI insights
                    </p>
                    <Brain className="h-5 w-5 text-cyan-300" />
                  </div>
                  <p className="text-sm text-foreground">
                    “Students understand energy flow; review decomposers and
                    nutrient cycles next.”
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* WHY NOW */}
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
            Why now
          </p>
          <h3 className="text-3xl font-semibold sm:text-4xl">
            Classrooms are changing. Lumo keeps pace.
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {whyNow.map((item) => (
              <Card
                key={item}
                className="border-white/10 bg-white/[0.03] text-muted-foreground backdrop-blur"
              >
                <CardContent className="p-5 text-sm">{item}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PROOF / TESTIMONIALS */}
        <section id="proof" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
                Trusted voices
              </p>
              <h3 className="text-3xl font-semibold sm:text-4xl">
                Proof from the classroom.
              </h3>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card
                key={item.name}
                className="border-white/10 bg-white/[0.03] backdrop-blur transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <CardContent className="space-y-3 p-5">
                  <p className="text-foreground">“{item.quote}”</p>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p>{item.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          id="cta"
          className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/15 via-slate-900 to-cyan-500/10 px-8 py-12 shadow-xl shadow-emerald-500/15"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
                Call to action
              </p>
              <h3 className="text-3xl font-semibold sm:text-4xl">
                Ready to light up your classroom?
              </h3>
              <p className="text-muted-foreground">
                Get started free, or talk with us about bringing Lumo to your
                school or district.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={primaryCtaHref}>
                    {isAuthed ? "Open dashboard" : "Get started free"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild variant="link" className="text-emerald-200">
                  <Link href="mailto:hello@lumo.app">
                    Talk to us about school plans
                  </Link>
                </Button>
              </div>
            </div>
            <Card className="border-white/10 bg-black/50">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      School-ready
                    </p>
                    <p className="font-semibold text-foreground">
                      Built for K–12 and higher-ed teams
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Collaborative
                    </p>
                    <p className="font-semibold text-foreground">
                      Invite co-teachers and instructional coaches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
