"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const JOIN_CODE_PATTERN = /^\d{6}$/;

export default function JoinSessionPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center text-sm text-muted-foreground">Loading...</div>}>
      <JoinSessionContent />
    </Suspense>
  );
}

function JoinSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leftNotice = useMemo(
    () => searchParams.get("left") === "1",
    [searchParams],
  );

  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = joinCode.trim();
    if (!JOIN_CODE_PATTERN.test(trimmed)) {
      setError("Enter the 6-digit code you were given.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/join/${trimmed}`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload?.error || "We could not join that session.");
        return;
      }

      router.push(`/session/${payload.session_id}`);
    } catch (fetchError) {
      console.error(fetchError);
      setError("We could not join that session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Join a live session
            </p>
            <h1 className="text-3xl font-semibold">Enter your code</h1>
          </div>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">One step to join</CardTitle>
            <CardDescription>
              Students can only enter sessions that are live. Use the six digit
              code your teacher shared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {leftNotice ? (
                <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                  You left the session. Use a code to rejoin when you are ready.
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="join-code">Join code</Label>
                <Input
                  id="join-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={error ? "true" : "false"}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground">
                  Only live sessions will accept new students.
                </p>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join session"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setJoinCode("");
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
