"use client";

import { CalendarPlus, X } from "lucide-react";
import { useMemo, useState } from "react";

type ScheduleDatesInputProps = {
  disabled: boolean;
  initialDates?: string[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function tomorrowValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateInputValue(tomorrow);
}

function uniqueSortedDates(dates: string[]) {
  return [...new Set(dates.filter(Boolean))].sort();
}

export function ScheduleDatesInput({
  disabled,
  initialDates = [],
}: ScheduleDatesInputProps) {
  const [dates, setDates] = useState(() => uniqueSortedDates(initialDates));
  const [draftDate, setDraftDate] = useState("");
  const serializedDates = useMemo(() => dates.join(","), [dates]);

  function addDate(date: string) {
    if (!date) {
      return;
    }

    setDates((current) => uniqueSortedDates([...current, date]));
    setDraftDate("");
  }

  function removeDate(date: string) {
    setDates((current) => current.filter((item) => item !== date));
  }

  return (
    <div className="grid gap-2">
      <input name="activeDates" required type="hidden" value={serializedDates} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Date to add"
          disabled={disabled}
          type="date"
          value={draftDate}
          onChange={(event) => setDraftDate(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        />
        <button
          type="button"
          disabled={disabled || !draftDate}
          onClick={() => addDate(draftDate)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition-transform disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.96]"
        >
          <CalendarPlus size={16} />
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => addDate(toDateInputValue(new Date()))}
          className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Today
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => addDate(tomorrowValue())}
          className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tomorrow
        </button>
        <button
          type="button"
          disabled={disabled || dates.length === 0}
          onClick={() => setDates([])}
          className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      {dates.length > 0 ? (
        <div className="flex min-h-10 flex-wrap gap-2 rounded-md bg-white p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
          {dates.map((date) => (
            <span
              key={date}
              className="inline-flex h-8 items-center gap-2 rounded-md bg-stone-100 pl-3 pr-1 text-sm font-semibold normal-case tracking-normal text-stone-700"
            >
              {formatDate(date)}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${formatDate(date)}`}
                onClick={() => removeDate(date)}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-stone-500 transition-colors hover:bg-white hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="flex min-h-10 items-center rounded-md bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-400 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
          No dates selected
        </div>
      )}
    </div>
  );
}
