"use client";

import { Clock, Mail, X } from "lucide-react";
import type { BookingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

interface Props {
  booking: BookingListItem;
  isLast?: boolean;
  showCancel: boolean;
  showCancelledBadge?: boolean;
  cancelling: boolean;
  onCancel: (id: string) => void;
}

export function BookingRow({
  booking,
  isLast = false,
  showCancel,
  showCancelledBadge = false,
  cancelling,
  onCancel,
}: Props) {
  const cancelled = booking.status === "CANCELLED";

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between",
        !isLast && "border-b border-border",
        cancelled && "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium text-foreground", cancelled && "line-through")}>
            {booking.attendeeName}
          </span>
          {showCancelledBadge && cancelled && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
              Cancelled
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">{booking.eventType.title}</span>
          <span className="text-sm text-muted-foreground">/book/{booking.eventType.slug}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatWhen(booking.startTime)}
          </span>
          <span>{booking.eventType.durationMinutes}m</span>
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {booking.attendeeEmail}
          </span>
        </div>
      </div>

      {showCancel && !cancelled && (
        <Button
          variant="outline"
          size="sm"
          disabled={cancelling}
          onClick={() => onCancel(booking.id)}
          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          {cancelling ? "Cancelling…" : "Cancel"}
        </Button>
      )}
    </div>
  );
}
