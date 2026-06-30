"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";

type ScheduleDatesInputProps = {
  disabled: boolean;
  initialDates?: string[];
  variant?: "inline" | "popover";
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function dateValue(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayValue() {
  const today = new Date();
  return dateValue(today.getFullYear(), today.getMonth(), today.getDate());
}

function tomorrowValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateValue(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
}

function uniqueSortedDates(dates: string[]) {
  return [...new Set(dates.filter(Boolean))].sort();
}

function monthFromDate(date: string) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getUTCFullYear();
  const monthIndex = monthDate.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

export function ScheduleDatesInput({
  disabled,
  initialDates = [],
  variant = "inline",
}: ScheduleDatesInputProps) {
  const [dates, setDates] = useState(() => uniqueSortedDates(initialDates));
  const [isOpen, setIsOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(() =>
    initialDates.length > 0 ? monthFromDate(initialDates[0]) : monthFromDate(todayValue()),
  );
  const serializedDates = useMemo(() => dates.join(","), [dates]);
  const selectedDates = useMemo(() => new Set(dates), [dates]);
  const calendarDays = useMemo(() => getCalendarDays(monthDate), [monthDate]);
  const today = todayValue();

  function toggleDate(date: string) {
    if (!date) {
      return;
    }

    setDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : uniqueSortedDates([...current, date]),
    );
  }

  function removeDate(date: string) {
    setDates((current) => current.filter((item) => item !== date));
  }

  function addQuickDate(date: string) {
    setDates((current) => uniqueSortedDates([...current, date]));
    setMonthDate(monthFromDate(date));
  }

  function changeMonth(direction: -1 | 1) {
    setMonthDate(
      (current) =>
        new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth() + direction,
            1,
          ),
        ),
    );
  }

  const calendar = (
    <div className="grid gap-3 rounded-md bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled}
          aria-label="Previous month"
          onClick={() => changeMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={17} />
        </button>
        <p className="text-sm font-semibold normal-case tracking-normal text-stone-950">
          {monthFormatter.format(monthDate)}
        </p>
        <button
          type="button"
          disabled={disabled}
          aria-label="Next month"
          onClick={() => changeMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="flex h-7 items-center justify-center text-[11px] font-semibold normal-case tracking-normal text-stone-400"
          >
            {label}
          </div>
        ))}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`blank-${index}`} className="h-9" />;
          }

          const value = dateValue(
            monthDate.getUTCFullYear(),
            monthDate.getUTCMonth(),
            day,
          );
          const isSelected = selectedDates.has(value);
          const isToday = value === today;

          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => toggleDate(value)}
              className={`flex h-9 items-center justify-center rounded-md text-sm font-semibold normal-case tracking-normal transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "bg-stone-950 text-white"
                  : isToday
                    ? "bg-white text-stone-950 shadow-[0_0_0_1px_rgba(0,0,0,0.18)] hover:bg-stone-100"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => addQuickDate(today)}
          className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Today
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => addQuickDate(tomorrowValue())}
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
        {variant === "popover" ? (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-auto h-9 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition-transform active:scale-[0.96]"
          >
            Done
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="relative grid gap-2">
      <input name="activeDates" required type="hidden" value={serializedDates} />
      {variant === "popover" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-left text-sm font-semibold normal-case tracking-normal text-stone-700 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] transition-colors hover:text-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} />
            {dates.length === 0
              ? "Choose dates"
              : `${dates.length} ${dates.length === 1 ? "date" : "dates"} selected`}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
            Edit
          </span>
        </button>
      ) : (
        calendar
      )}
      {variant === "popover" && isOpen ? (
        <div className="absolute left-0 top-12 z-30 w-[min(340px,calc(100vw-48px))]">
          {calendar}
        </div>
      ) : null}
      {dates.length > 0 ? (
        <div className="flex min-h-10 flex-wrap gap-2 rounded-md bg-stone-50 p-2">
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
