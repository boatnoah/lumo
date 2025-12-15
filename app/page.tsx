import { AuthButton } from "@/components/auth-button";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureSection } from "@/components/landing/feature-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import {
  SparklesIcon,
  UsersIcon,
  PresentationIcon,
  MessageSquareIcon,
  BarChart3Icon,
  ZapIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboardv2");
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Lumo
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-16">
        <HeroSection />
      </div>

      {/* Feature Sections */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4">
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-32">
            <FeatureCard
              icon={<PresentationIcon className="w-8 h-8" />}
              title="Interactive Sessions"
              description="Create polls, quizzes, and discussions. Upload PDF slides and control the flow in real-time."
            />
            <FeatureCard
              icon={<UsersIcon className="w-8 h-8" />}
              title="Real-Time Participation"
              description="Students join instantly with a code. Anonymous responses lower anxiety and boost engagement."
            />
            <FeatureCard
              icon={<BarChart3Icon className="w-8 h-8" />}
              title="Live Analytics"
              description="See who's participating, track responses, and adjust your teaching on the fly."
            />
          </div>
        </div>
      </section>

      {/* Detailed Feature 1: Teacher Dashboard */}
      <FeatureSection
        title="Built for teachers"
        description="Create engaging sessions with multiple question types—MCQ, short answer, or long response. Upload your existing slides as PDFs and weave in interactive prompts seamlessly."
        imagePosition="right"
      >
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full p-8 flex flex-col gap-4">
            <div className="bg-background/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded-md w-3/4" />
                <div className="h-4 bg-muted rounded-md w-full" />
                <div className="h-4 bg-muted rounded-md w-2/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-border/50">
                <div className="h-3 bg-primary/20 rounded w-16 mb-2" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
              <div className="bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-border/50">
                <div className="h-3 bg-primary/20 rounded w-16 mb-2" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </FeatureSection>

      {/* Detailed Feature 2: Student Experience */}
      <FeatureSection
        title="Designed for students"
        description="Join any session instantly with a simple code. Participate anonymously or show your name. Chat with classmates and respond to prompts—all from any device."
        imagePosition="left"
      >
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full p-8 flex flex-col gap-4">
            <div className="bg-background/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-24 mb-2" />
                    <div className="h-8 bg-muted rounded-lg" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-20 mb-2" />
                    <div className="h-8 bg-muted rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-border/50">
              <div className="h-10 bg-primary/10 rounded-lg flex items-center px-3">
                <div className="h-3 bg-primary/30 rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </FeatureSection>

      {/* Detailed Feature 3: Real-Time Insights */}
      <FeatureSection
        title="Insights that matter"
        description="See instant feedback on every question. Track participation, identify patterns, and adjust your approach in real-time to ensure every voice is heard."
        imagePosition="right"
      >
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950 dark:via-purple-950 dark:to-fuchsia-950 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full p-8 flex flex-col gap-4">
            <div className="bg-background/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-3 bg-primary/30 rounded w-12" />
                </div>
                <div className="h-32 bg-gradient-to-t from-primary/5 to-primary/20 rounded-lg" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-primary/10 rounded" />
                  <div className="h-8 bg-primary/10 rounded" />
                  <div className="h-8 bg-primary/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </FeatureSection>

      {/* Stats Section */}
      <section className="py-24 lg:py-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-16">
            Everything you need to engage every student
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              icon={<SparklesIcon className="w-6 h-6" />}
              label="Question Types"
              value="4+"
            />
            <StatCard
              icon={<ZapIcon className="w-6 h-6" />}
              label="Real-Time"
              value="Instant"
            />
            <StatCard
              icon={<MessageSquareIcon className="w-6 h-6" />}
              label="Live Chat"
              value="Built-in"
            />
            <StatCard
              icon={<UsersIcon className="w-6 h-6" />}
              label="Anonymous"
              value="Optional"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© 2025 Lumo</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Interactive Classroom Engagement
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/auth/login"
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="hover:text-foreground transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative p-6 lg:p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <div className="text-primary">{icon}</div>
        </div>
        <h3 className="text-xl font-semibold mb-3 tracking-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
      <div className="flex justify-center mb-4 text-primary">{icon}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
