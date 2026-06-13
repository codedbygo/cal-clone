"use client";

import Link from "next/link";
import { Globe, MoreHorizontal } from "lucide-react";
import type { AvailabilitySchedule } from "@/lib/types";

interface Props {
  schedule: AvailabilitySchedule;
}

export function ScheduleListRow({ schedule }: Props) {
  return (
    <Link
      href={`/availability/${schedule.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{schedule.name}</span>
          {schedule.isDefault && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{schedule.summary}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          {schedule.timezone.replace(/_/g, " ")}
        </p>
      </div>
      <span className="shrink-0 rounded-md p-2 text-muted-foreground">
        <MoreHorizontal className="h-5 w-5" />
      </span>
    </Link>
  );
}
