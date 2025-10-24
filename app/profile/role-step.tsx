"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export default function RoleStep({ hasAvatar }: { hasAvatar: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const choose = async (role: "teacher" | "student") => {
    setLoading(role);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.replace("/auth/login");

    await supabase.from("profiles").update({ role }).eq("user_id", user.id);

    // If avatar not set yet, go to avatar step; else finish
    router.replace(hasAvatar ? "/dashboard" : "/profile/avatar");
  };

  return (
    <div>
      <div className="h-2 w-full bg-muted rounded-full mb-6">
        <div className="h-2 bg-primary rounded-full" style={{ width: "50%" }} />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Choose your role</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pick one to continue.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            key: "teacher",
            title: "Teacher",
            desc: "Create sessions & view results",
          },
          { key: "student", title: "Student", desc: "Join sessions & answer" },
        ].map((opt, i) => (
          <motion.button
            key={opt.key}
            onClick={() => choose(opt.key as "teacher" | "student")}
            disabled={!!loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl border p-6 text-left hover:shadow-md transition disabled:opacity-50"
          >
            <div className="text-lg font-medium">{opt.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{opt.desc}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
