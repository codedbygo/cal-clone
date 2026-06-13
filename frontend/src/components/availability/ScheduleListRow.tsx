"use client";

import Link from "next/link";
import { Globe, MoreHorizontal } from "lucide-react";
import type { AvailabilitySchedule } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  schedule: AvailabilitySchedule;
}

export function ScheduleListRow({ schedule }: Props) {
  return (
    <Link
      href={`/availability/${schedule.id}`}
      className="flex items-center justify-between gap-4 border-b border-[var(--cal-border)] px-4 py-4 transition-colors last:border-b-0 hover:bg-[#1a1a1a]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-white">{schedule.name}</span>
          {schedule.isDefault && (
            <span className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-xs text-[var(--cal-muted)]">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--cal-muted)]">{schedule.summary}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--cal-subtle)]">
          <Globe className="h-3.5 w-3.5" />
          {schedule.timezone.replace(/_/g, " ")}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className={cn(
          "shrink-0 rounded-md p-2 text-[var(--cal-muted)] hover:bg-[#2a2a2a] hover:text-white",
        )}
        aria-label="Schedule options"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </Link>
  );
}
