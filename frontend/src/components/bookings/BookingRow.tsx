"use client";

import Link from "next/link";
import { Clock, ExternalLink, Mail, Video, X } from "lucide-react";
import type { BookingListItem } from "@/lib/types";
import {
  cn,
  formatBookingListDate,
  formatBookingListTimeRange,
  formatBookingMeetingTitle,
  meetingJoinLabel,
  resolveMeetingUrl,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const hostName = booking.eventType.user?.name ?? "Default Host";
  const joinUrl = resolveMeetingUrl(booking.id, booking.meetingUrl);
  const externalJoin = joinUrl.startsWith("http");
  const meetingTitle = formatBookingMeetingTitle(
    booking.eventType.durationMinutes,
    booking.eventType.title,
    hostName,
    booking.attendeeName,
  );

  return (
    <div
      className={cn(
        "group flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between",
        !isLast && "border-b border-border",
        cancelled && "opacity-70",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4 sm:gap-6">
        <div className="w-28 shrink-0">
          <p className="text-sm font-semibold text-foreground">
            {formatBookingListDate(booking.startTime)}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ({formatBookingListTimeRange(booking.startTime, booking.endTime)})
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-sm text-foreground", cancelled && "line-through")}>
              {meetingTitle}
            </p>
            {showCancelledBadge && cancelled && (
              <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                Cancelled
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {booking.attendeeEmail}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {booking.eventType.durationMinutes}m
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showCancel && !cancelled && (
          <>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link
                href={joinUrl}
                target={externalJoin ? "_blank" : undefined}
                rel={externalJoin ? "noopener noreferrer" : undefined}
              >
                <Video className="h-3.5 w-3.5" />
                {meetingJoinLabel(booking.meetingProvider)}
                {externalJoin && <ExternalLink className="h-3 w-3 opacity-60" />}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={cancelling}
              onClick={() => onCancel(booking.id)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              {cancelling ? "Cancelling…" : "Cancel"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
