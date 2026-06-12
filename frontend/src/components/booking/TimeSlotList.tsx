"use client";

import type { Slot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  dayLabel: string | null;
  slots: Slot[];
  loading: boolean;
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
}

export function TimeSlotList({
  dayLabel,
  slots,
  loading,
  selectedSlot,
  onSelect,
}: Props) {
  return (
    <div className="flex min-h-[320px] flex-col p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-white">
          {dayLabel ?? "Select a date"}
        </span>
        <div className="flex rounded-md border border-[#2a2a2a] text-xs">
          <span className="rounded-l-md bg-white px-2 py-1 font-medium text-black">
            12h
          </span>
          <span className="px-2 py-1 text-[#6b7280]">24h</span>
        </div>
      </div>

      {!dayLabel && (
        <p className="text-sm text-[#6b7280]">
          Pick an available day on the calendar to see times.
        </p>
      )}

      {dayLabel && loading && (
        <p className="text-sm text-[#6b7280]">Loading times…</p>
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
                {slot.time}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
