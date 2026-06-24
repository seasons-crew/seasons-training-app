"use client";

import { Edit3, X } from "lucide-react";
import { useRef } from "react";
import type { SportCategory } from "@/lib/types";

type WorkoutEditModalProps = {
  action: (formData: FormData) => Promise<void>;
  activeDate: string;
  canEdit: boolean;
  id: string;
  sport: SportCategory;
  title: string;
};

const inputClass =
  "h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

export function WorkoutEditModal({
  action,
  activeDate,
  canEdit,
  id,
  sport,
  title,
}: WorkoutEditModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Edit3 size={16} />
        Edit
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-32px)] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-stone-200 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/40"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Edit workout</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-stone-300 hover:text-stone-950"
          >
            <X size={16} />
          </button>
        </div>
        <form action={action} className="grid max-h-[calc(100dvh-120px)] gap-4 overflow-y-auto p-5">
          <input type="hidden" name="id" value={id} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Title
            <input name="title" required disabled={!canEdit} defaultValue={title} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Sport
            <select name="sport" disabled={!canEdit} defaultValue={sport} className={inputClass}>
              <option value="snow">Snow</option>
              <option value="earth">Earth</option>
              <option value="water">Water</option>
              <option value="general">General</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Active date
            <input name="activeDate" required type="date" disabled={!canEdit} defaultValue={activeDate} className={inputClass} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              disabled={!canEdit}
              className="h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
