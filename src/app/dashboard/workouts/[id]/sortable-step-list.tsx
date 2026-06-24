"use client";

import Image from "next/image";
import { GripVertical, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { StepBuilderForm } from "./step-builder-form";
import type { HydratedWorkoutStep, MediaAsset } from "@/lib/types";

type SortableStepListProps = {
  canEdit: boolean;
  deleteAction: (formData: FormData) => Promise<void>;
  mediaAssets: MediaAsset[];
  reorderAction: (formData: FormData) => Promise<void>;
  steps: HydratedWorkoutStep[];
  updateAction: (formData: FormData) => Promise<void>;
  workoutId: string;
};

function advanceLabel(step: HydratedWorkoutStep) {
  if (step.advanceMode === "timer") {
    return `${step.durationSeconds || 0}s timer, ${step.timerStartMode || "auto"} start`;
  }

  if (step.advanceMode === "manual") {
    return `Manual: ${step.manualButtonLabel || "Done"}`;
  }

  return "Advance at video end";
}

function reorderItems(items: HydratedWorkoutStep[], draggedId: string, targetId: string) {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
    return items;
  }

  const next = [...items];
  const [dragged] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, dragged);
  return next;
}

export function SortableStepList({
  canEdit,
  deleteAction,
  mediaAssets,
  reorderAction,
  steps,
  updateAction,
  workoutId,
}: SortableStepListProps) {
  const [items, setItems] = useState(steps);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();


  function persistOrder(nextItems: HydratedWorkoutStep[]) {
    const formData = new FormData();
    formData.set("workoutId", workoutId);
    formData.set("stepIds", JSON.stringify(nextItems.map((step) => step.id)));

    startTransition(() => {
      void reorderAction(formData);
    });
  }

  if (!items.length) {
    return (
      <div className="px-5 py-10 text-center text-sm font-medium text-stone-500">
        Add a media step to start building this workout.
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-5">
      {items.map((step, index) => (
        <article
          key={step.id}
          draggable={canEdit}
          onDragStart={() => setDraggedId(step.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (!draggedId) {
              return;
            }

            const next = reorderItems(items, draggedId, step.id);
            setDraggedId(null);
            setItems(next);
            persistOrder(next);
          }}
          className="grid gap-4 rounded-md border border-stone-200 bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] lg:grid-cols-[44px_140px_minmax(0,1fr)]"
        >
          <div className="flex items-center justify-between gap-2 lg:flex-col lg:justify-start">
            <button
              type="button"
              disabled={!canEdit}
              aria-label="Drag to reorder"
              className="flex h-10 w-10 cursor-grab items-center justify-center rounded-md border border-stone-200 text-stone-400 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GripVertical size={18} />
            </button>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500">
              {index + 1}
            </span>
          </div>

          {step.media.thumbnailUrl ? (
            <Image
              src={step.media.thumbnailUrl}
              alt=""
              width={220}
              height={140}
              className="aspect-video w-full rounded-md bg-stone-100 object-cover outline outline-1 outline-black/10"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-stone-100 text-sm font-semibold text-stone-400">
              Processing
            </div>
          )}

          <div className="min-w-0 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold">{step.media.title}</p>
                <p className="mt-1 text-sm text-stone-500">{advanceLabel(step)}</p>
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={step.id} />
                <input type="hidden" name="workoutId" value={workoutId} />
                <button
                  disabled={!canEdit}
                  aria-label="Remove step"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={17} />
                </button>
              </form>
            </div>

            <details className="group border-t border-stone-100 pt-3">
              <summary className="flex h-10 cursor-pointer list-none items-center justify-center rounded-md border border-stone-300 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950">
                Edit step
              </summary>
              <div className="mt-3">
                <StepBuilderForm
                  action={updateAction}
                  canEdit={canEdit}
                  mediaAssets={mediaAssets}
                  step={step}
                  submitLabel="Save step"
                  workoutId={workoutId}
                />
              </div>
            </details>
          </div>
        </article>
      ))}
    </div>
  );
}
