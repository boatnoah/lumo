"use client";

import { Plus } from "lucide-react";

import { useCreateUnit, type PromptKind } from "@/hooks/use-create-unit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AddUnitMenuProps = {
  sessionId: string | number;
};

const optionLabels: Record<PromptKind, string> = {
  slide: "Add slide",
  mcq: "Add multiple choice",
  short_text: "Add short response",
  long_text: "Add long response",
};

export function AddUnitMenu({ sessionId }: AddUnitMenuProps) {
  const { createUnit, pendingKind } = useCreateUnit(sessionId);

  const handleSelect = async (event: Event, kind: PromptKind) => {
    event.preventDefault();
    await createUnit(kind);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={Boolean(pendingKind)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add unit</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(["slide", "mcq", "short_text", "long_text"] as PromptKind[]).map((kind) => (
          <DropdownMenuItem
            key={kind}
            onSelect={(event) => handleSelect(event, kind)}
            disabled={pendingKind === kind}
          >
            {optionLabels[kind]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
