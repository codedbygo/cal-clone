"use client";

import { useState } from "react";
import type { Slot } from "@/lib/types";
import { cn, formatSlotTime } from "@/lib/utils";

interface Props {
  dayLabel: string | null;
  slots: Slot[];
  loading: boolean;
  timezone: string;
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
}

export function TimeSlotList({
  dayLabel,
  slots,
  loading,
  timezone,
  selectedSlot,
  onSelect,
}: Props) {
  const [use24h, setUse24h] = useState(false);

  return (
    <div className="flex min-h-[320px] flex-col p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-white">
          {dayLabel ?? "Select a date"}
        </span>
        <div className="flex rounded-md border border-[#2a2a2a] text-xs">
          <button
            type="button"
            onClick={() => setUse24h(false)}
            className={cn(
              "rounded-l-md px-2 py-1 transition-colors",
              !use24h
                ? "bg-white font-medium text-black"
                : "text-[#6b7280] hover:text-white",
            )}
          >
            12h
          </button>
          <button
            type="button"
            onClick={() => setUse24h(true)}
            className={cn(
              "rounded-r-md px-2 py-1 transition-colors",
              use24h
                ? "bg-white font-medium text-black"
                : "text-[#6b7280] hover:text-white",
            )}
          >
            24h
          </button>
        </div>
      </div>

      {!dayLabel && !loading && (
        <p className="text-sm text-[#6b7280]">
          Pick an available day on the calendar to see times.
        </p>
      )}

      {!dayLabel && loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-[#2a2a2a]/60"
            />
          ))}
        </div>
      )}

      {dayLabel && loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-[#2a2a2a]/60"
            />
          ))}
        </div>
      )}

      {dayLabel && !loading && slots.length === 0 && (
        <p className="text-sm text-[#6b7280]">
          No available times on this day.
        </p>
      )}

      {dayLabel && !loading && slots.length > 0 && (
        <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto pr-1">
          {slots.map((slot) => {
            const active = selectedSlot?.startTime === slot.startTime;
            const label = formatSlotTime(slot.startTime, timezone, use24h);
            return (
              <button
                key={slot.startTime}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "border-white bg-white text-black"
                    : "border-[#2a2a2a] bg-[#1a1a1a] text-white hover:border-[#4a4a4a]",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    active ? "bg-emerald-500" : "bg-emerald-400",
                  )}
                />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
