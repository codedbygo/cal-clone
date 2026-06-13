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
  showCancel: boolean;
  showCancelledBadge?: boolean;
  cancelling: boolean;
  onCancel: (id: string) => void;
}

export function BookingRow({
  booking,
  showCancel,
  showCancelledBadge = false,
  cancelling,
  onCancel,
}: Props) {
  const cancelled = booking.status === "CANCELLED";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
        cancelled && "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium text-gray-900", cancelled && "line-through")}>
            {booking.attendeeName}
          </span>
          {showCancelledBadge && cancelled && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
              Cancelled
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {booking.eventType.title}
          </span>
          <span className="text-xs text-gray-400">/book/{booking.eventType.slug}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
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
          className="shrink-0 border-red-200 text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
          {cancelling ? "Cancelling…" : "Cancel"}
        </Button>
      )}
    </div>
  );
}
