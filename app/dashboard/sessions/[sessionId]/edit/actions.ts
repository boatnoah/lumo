"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function saveSessionAction(formData: FormData) {
  const sessionId = formData.get("sessionId");
  const title = formData.get("title");
  const description = formData.get("description");

  if (
    typeof sessionId !== "string" ||
    typeof title !== "string" ||
    typeof description !== "string"
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({
      title: title.trim(),
      description: description.trim() || "",
    })
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/editor?sessionId=${encodeURIComponent(sessionId)}`);
}

export async function cancelEditAction() {
  redirect("/dashboard");
}
