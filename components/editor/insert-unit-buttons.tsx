"use client";

import { Bookmark, FileText, Plus, Sparkles } from "lucide-react";

import { useCreateUnit } from "@/hooks/use-create-unit";
import { Button } from "@/components/ui/button";

type InsertUnitButtonsProps = {
  sessionId: string | number;
};

export function InsertUnitButtons({ sessionId }: InsertUnitButtonsProps) {
  const { createUnit, pendingKind } = useCreateUnit(sessionId);

  const buttons = [
    {
      kind: "slide" as const,
      label: "New slide",
      icon: Plus,
    },
    {
      kind: "mcq" as const,
      label: "Multiple choice",
      icon: Bookmark,
    },
    {
      kind: "short_text" as const,
      label: "Short response",
      icon: Sparkles,
    },
    {
      kind: "long_text" as const,
      label: "Long response",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-2">
      {buttons.map(({ kind, label, icon: Icon }) => (
        <Button
          key={kind}
          className="w-full justify-start"
          variant="outline"
          disabled={pendingKind === kind}
          onClick={() => createUnit(kind)}
        >
          <Icon className="mr-2 h-4 w-4" />
          {pendingKind === kind ? "Creating..." : label}
        </Button>
      ))}
    </div>
  );
}
