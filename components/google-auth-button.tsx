"use client";

import { createClient } from "@/utils/supabase/client";

export default function GoogleAuthButton() {
  const supabase = createClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: ${location.origin}/auth/callback?next=/,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <div className="flex gap-3">
      <button onClick={signIn} className="rounded border px-4 py-2">
        Continue with Google
      </button>
      <button onClick={signOut} className="rounded border px-4 py-2">
        Sign out
      </button>
    </div>
  );
}
