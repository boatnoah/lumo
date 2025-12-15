import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateJoinCode() {
  // 6-digit numeric
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const supabase = await createClient();

  let title: string | undefined;
  try {
    const body = (await request.json()) as { title?: unknown } | null;
    if (typeof body?.title === "string") {
      title = body.title.trim();
    }
  } catch {
    // no body is fine; fall back to default title
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: authError?.message || "Unauthorized" },
      { status: 401 },
    );
  }

  for (let i = 0; i < 10; i++) {
    const join_code = generateJoinCode();
    const safeTitle = title && title.length > 0 ? title : "Untitled session";

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        owner_id: user.id,
        status: "draft",
        title: safeTitle,
        join_code,
      })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ session: data }, { status: 201 });
    }

    // if it's not a unique violation, bubble it up so you can see it
    if (error.code !== "23505") {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Could not generate unique join code" },
    { status: 500 },
  );
}
