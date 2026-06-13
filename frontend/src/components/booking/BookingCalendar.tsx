"use client";

import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  addDays,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface Props {
  month: Date;
  selected: Date | null;
  availableDates: Set<string>;
  loading?: boolean;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
}

export function BookingCalendar({
  month,
  selected,
  availableDates,
  loading = false,
  onMonthChange,
  onSelect,
}: Props) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const today = startOfDay(new Date());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }

  return (
    <div className="flex flex-col p-6 lg:border-r lg:border-gray-200 lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {format(month, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && (
        <p className="mb-3 text-center text-xs text-gray-400">Loading availability…</p>
      )}

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-2 text-center text-[10px] font-medium tracking-wide text-gray-400"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const dateKey = format(day, "yyyy-MM-dd");
          const available = availableDates.has(dateKey);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const past = isBefore(day, today);
          const weekday = day.getDay();
          const isWeekday = weekday >= 1 && weekday <= 5;
          const disabled = !inMonth || past || (!loading && !available);
          const pending = loading && inMonth && !past && isWeekday;

          return (
            <div key={dateKey} className="flex justify-center py-0.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelect(day)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors",
                  !inMonth && "invisible",
                  pending && "animate-pulse bg-gray-100 text-gray-400",
                  isSelected && "bg-gray-900 font-semibold text-white hover:bg-gray-800",
                  !isSelected &&
                    !pending &&
                    available &&
                    !past &&
                    "bg-gray-100 text-gray-900 hover:bg-gray-200",
                  !isSelected &&
                    !pending &&
                    (!available || past) &&
                    inMonth &&
                    "text-gray-300",
                  disabled && !pending && "cursor-default",
                )}
              >
                {isToday(day) && !isSelected && (
                  <span className="absolute top-1.5 h-1 w-1 rounded-full bg-gray-900" />
                )}
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function formatSelectedDay(date: Date): string {
  return format(date, "EEE d");
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  return parseISO(key);
}
