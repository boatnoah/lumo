"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

type DeckSidebarUnit = {
  id: string;
  promptId: number;
  slideIndex: number;
  type: "slide" | "mcq" | "short_text" | "long_text";
  title: string;
  subtitle: string;
  status: string;
  page?: number | null;
};

type DeckSidebarProps = {
  sessionId: string | number;
  units: DeckSidebarUnit[];
};

export function DeckSidebar({ sessionId, units }: DeckSidebarProps) {
  const router = useRouter();
  const [items, setItems] = useState(units);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItems(units);
  }, [units]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const previousItems = [...items];
    const oldIndex = currentItems.findIndex((item) => item.id === active.id);
    const newIndex = currentItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newItems = arrayMove(currentItems, oldIndex, newIndex);
    setItems(newItems);
    setIsSaving(true);

    try {
      const response = await fetch("/api/slides/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          order: newItems.map((unit, index) => ({
            promptId: unit.promptId,
            position: index + 1,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Failed to update order");
      }

      setItems((currentItems) =>
        currentItems.map((unit, index) => ({
          ...unit,
          slideIndex: index + 1,
        })),
      );
      toast.success("Deck reordered");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reorder";
      toast.error(message);
      setItems(previousItems);
    } finally {
      setIsSaving(false);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
        Nothing here yet. Use the insert actions to add your first unit.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((unit, index) => (
            <SortableSidebarUnit
              key={unit.id}
              unit={unit}
              index={index}
              disabled={isSaving}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

type SortableSidebarUnitProps = {
  unit: DeckSidebarUnit;
  index: number;
  disabled?: boolean;
};

function SortableSidebarUnit({
  unit,
  index,
  disabled,
}: SortableSidebarUnitProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: unit.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="flex w-full items-center gap-3 rounded-lg border bg-muted px-3 py-2 text-left text-sm transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={style}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      {unit.type === "slide" ? (
        <div className="flex h-12 w-16 items-center justify-center rounded-md bg-background font-semibold text-muted-foreground">
          {unit.page ?? unit.slideIndex}
        </div>
      ) : (
        <div className="flex h-12 w-16 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold uppercase text-primary">
          {unit.type === "mcq"
            ? "MCQ"
            : unit.type === "short_text"
              ? "Short"
              : "Long"}
        </div>
      )}
      <div className="flex flex-1 flex-col truncate">
        <span className="font-medium">
          {index + 1}. {unit.title}
        </span>
        <span className="text-xs text-muted-foreground">{unit.subtitle}</span>
      </div>
      <Badge variant="outline" className="text-[10px] uppercase">
        {unit.status}
      </Badge>
    </button>
  );
}
