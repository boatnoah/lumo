import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cancelEditAction, saveSessionAction } from "./actions";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId: sessionIdParam } = await params;
  const supabase = await createClient();
  const sessionIdFilter = Number.isNaN(Number(sessionIdParam))
    ? sessionIdParam
    : Number(sessionIdParam);

  const { data: session, error } = await supabase
    .from("sessions")
    .select("session_id, title, description, status")
    .eq("session_id", sessionIdFilter)
    .maybeSingle();

  if (error || !session) {
    notFound();
  }

  return (
    <div className="flex flex-row min-h-screen justify-center items-center p-6">
      <form
        action={saveSessionAction}
        className="w-full max-w-2xl space-y-8"
      >
        <input type="hidden" name="sessionId" value={session.session_id} />
        <div>
          <p className="text-sm text-muted-foreground">
            Session ID: {session.session_id} · Status: {session.status}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Edit Session
          </h1>
        </div>

        <FieldGroup className="space-y-6">
          <Field>
            <FieldLabel htmlFor="session-title">Session Title</FieldLabel>
            <Input
              id="session-title"
              name="title"
              defaultValue={session.title}
              placeholder="e.g. Intro to Stoichiometry"
              required
            />
            <FieldDescription>
              Give your session a clear, descriptive name.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="session-description">
              Session Description
            </FieldLabel>
            <Textarea
              id="session-description"
              name="description"
              defaultValue={session.description ?? ""}
              placeholder="Outline the goals, agenda, or prompts for this session."
              rows={5}
            />
            <FieldDescription>
              Optional context to help participants understand the session.
            </FieldDescription>
          </Field>

          <Field orientation="horizontal" className="gap-4">
            <Button type="submit">Save Changes</Button>
            <Button
              variant="outline"
              type="submit"
              formAction={cancelEditAction}
            >
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
