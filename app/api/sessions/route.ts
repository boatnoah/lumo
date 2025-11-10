import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateJoinCode() {
  // 6-digit numeric
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST() {
  const supabase = await createClient();

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

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        owner_id: user.id,
        status: "draft",
        title: "Untitled session",
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
