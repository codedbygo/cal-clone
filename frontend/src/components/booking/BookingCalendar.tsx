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
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
}

export function BookingCalendar({
  month,
  selected,
  availableDates,
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
    <div className="flex flex-col p-6 lg:border-x lg:border-[#2a2a2a] lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-white">
          {format(month, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="rounded-md p-1.5 text-[#9ca3af] hover:bg-[#2a2a2a] hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-md p-1.5 text-[#9ca3af] hover:bg-[#2a2a2a] hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-2 text-center text-[10px] font-medium tracking-wide text-[#6b7280]"
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
          const disabled = !inMonth || !available || past;

          return (
            <div key={dateKey} className="flex justify-center py-0.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelect(day)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors",
                  !inMonth && "invisible",
                  isSelected &&
                    "bg-white font-semibold text-black hover:bg-white",
                  !isSelected &&
                    available &&
                    !past &&
                    "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]",
                  !isSelected &&
                    (!available || past) &&
                    inMonth &&
                    "text-[#6b7280]",
                  disabled && "cursor-default",
                )}
              >
                {isToday(day) && !isSelected && (
                  <span className="absolute top-1.5 h-1 w-1 rounded-full bg-white" />
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
