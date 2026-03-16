import Link from "next/link";
import { Home, ArrowRight, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-2xl border border-border/60 bg-background p-8 md:p-10 shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-6">
          <SearchX className="h-6 w-6 text-muted-foreground" />
        </div>

        <p className="text-sm font-medium text-muted-foreground mb-3">Error 404</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          This page does not exist
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          The link may be broken, or the page might have been removed. Use one
          of the options below to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/session">
              Join Session
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
