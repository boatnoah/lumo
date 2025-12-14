// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Keep ?next if it's a safe relative path
  let next = searchParams.get("next") ?? null;
  if (next && !next.startsWith("/")) next = null;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();

  // 1) Exchange auth code -> session cookie
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // 2) Ensure profile exists
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/auth/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  let destination = "/dashboardv2";

  if (!profile) {
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      display_name:
        (typeof user.user_metadata === "object" &&
        user.user_metadata !== null &&
        "full_name" in user.user_metadata
          ? (user.user_metadata as { full_name?: string | null }).full_name
          : null) ??
        user.email?.split("@")[0] ??
        "User",
      role: "pending",
      avatar: "",
    });
    if (error) {
      console.error(error);
    }
    destination = "/profile";
  } else if (!profile.role) {
    destination = "/profile";
  } else if (next) {
    destination = next; // only after we know they already have a role
  }

  // 3) Redirect (preserve your forwarded host logic)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${destination}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${destination}`);
  } else {
    return NextResponse.redirect(`${origin}${destination}`);
  }
}

// Optional for some hosting setups
export const dynamic = "force-dynamic";
