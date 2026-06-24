"use client";

import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import type { HydratedWorkoutStep, MediaAsset, StepAdvanceMode } from "@/lib/types";

type StepBuilderFormProps = {
  action: (formData: FormData) => Promise<void>;
  canEdit: boolean;
  mediaAssets: MediaAsset[];
  step?: HydratedWorkoutStep;
  submitLabel: string;
  workoutId: string;
};

const inputClass =
  "h-10 min-w-0 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

export function StepBuilderForm({
  action,
  canEdit,
  mediaAssets,
  step,
  submitLabel,
  workoutId,
}: StepBuilderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const defaultAdvanceMode = step?.advanceMode || "video_end";
  const [advanceMode, setAdvanceMode] = useState<StepAdvanceMode>(defaultAdvanceMode);
  const [isPending, startTransition] = useTransition();

  function submitStep(formData: FormData) {
    startTransition(async () => {
      await action(formData);

      if (!step) {
        formRef.current?.reset();
        setAdvanceMode("video_end");
      }
    });
  }

  return (
    <form ref={formRef} action={submitStep} className="grid gap-3 rounded-md bg-stone-50 p-3">
      <input type="hidden" name="workoutId" value={workoutId} />
      {step ? <input type="hidden" name="id" value={step.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_140px_auto] lg:items-end">
        <label className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
          Media
          <select
            name="mediaAssetId"
            required
            disabled={!canEdit || mediaAssets.length === 0}
            defaultValue={step?.mediaAssetId || mediaAssets[0]?.id}
            className={inputClass}
          >
            {mediaAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
          Advance
          <select
            name="advanceMode"
            disabled={!canEdit}
            value={advanceMode}
            onChange={(event) => setAdvanceMode(event.target.value as StepAdvanceMode)}
            className={inputClass}
          >
            <option value="video_end">Video end</option>
            <option value="timer">Timer</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        {advanceMode === "timer" ? (
          <label key="timer-start" className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Start
            <select
              name="timerStartMode"
              disabled={!canEdit}
              defaultValue={step?.timerStartMode || "auto"}
              className={inputClass}
            >
              <option value="auto">Auto</option>
              <option value="tap">Tap</option>
            </select>
          </label>
        ) : null}
        <button
          disabled={!canEdit || mediaAssets.length === 0 || isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} />
          {isPending ? "Saving" : submitLabel}
        </button>
      </div>
      {advanceMode === "timer" ? (
        <label key="timer-seconds" className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 sm:max-w-44">
          Seconds
          <input
            name="durationSeconds"
            required
            disabled={!canEdit}
            defaultValue={step?.durationSeconds}
            inputMode="numeric"
            placeholder="30"
            className={inputClass}
          />
        </label>
      ) : null}
      {advanceMode === "manual" ? (
        <label key="manual-label" className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 sm:max-w-sm">
          Button label
          <input
            name="manualButtonLabel"
            disabled={!canEdit}
            defaultValue={step?.manualButtonLabel || "Done"}
            placeholder="Done"
            className={inputClass}
          />
        </label>
      ) : null}
    </form>
  );
}
