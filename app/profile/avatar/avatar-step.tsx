"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = [
  "https://hxaeqpesknvwhfdvylxm.supabase.co/storage/v1/object/public/avatars/mega_knight.png",
  "https://hxaeqpesknvwhfdvylxm.supabase.co/storage/v1/object/public/avatars/recruits.png",
  "https://hxaeqpesknvwhfdvylxm.supabase.co/storage/v1/object/public/avatars/royal_giant.png",
];

export default function AvatarStep() {
  const supabase = createClient();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.replace("/auth/login");

    await supabase
      .from("profiles")
      .update({ avatar: selected })
      .eq("user_id", user.id);
    router.replace("/dashboardv2");
  };

  return (
    <div>
      <div className="h-2 w-full bg-muted rounded-full mb-6">
        <div
          className="h-2 bg-primary rounded-full"
          style={{ width: "100%" }}
        />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Choose an avatar</h1>
      <p className="text-sm text-muted-foreground mb-6">
        You can change this later.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {AVATARS.map((src, i) => (
          <motion.button
            key={src}
            type="button"
            onClick={() => setSelected(src)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`aspect-square rounded-2xl border overflow-hidden focus:outline-none 
              ${selected === src ? "ring-2 ring-primary" : "hover:shadow"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
          </motion.button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={save}
          disabled={!selected || saving}
          className="rounded-xl px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving..." : "Finish"}
        </button>
        <button
          onClick={() => router.replace("/dashboardv2")}
          className="rounded-xl px-4 py-2 border"
        >
          Skip for now
        </button>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            key="pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            Looks good!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
