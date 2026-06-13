"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ExternalLink } from "lucide-react";
import { getBooking } from "@/lib/api";
import type { BookingWithEvent } from "@/lib/types";
import {
  formatBookingDate,
  formatBookingTimeRange,
  meetingProviderLabel,
  resolveMeetingUrl,
} from "@/lib/utils";
import { ConfirmationPageSkeleton } from "@/components/booking/ConfirmationPageSkeleton";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[5rem_1fr] sm:gap-6">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function PersonLine({
  name,
  email,
  badge,
  badgeClass,
}: {
  name: string;
  email: string;
  badge: string;
  badgeClass: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{name}</span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <p className="mt-0.5 text-muted-foreground">{email}</p>
    </div>
  );
}

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [booking, setBooking] = useState<BookingWithEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }
    getBooking(id)
      .then(setBooking)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <ConfirmationPageSkeleton />;
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p className="text-lg font-medium text-foreground">Booking not found</p>
        <Link href="/" className="mt-4 text-sm text-muted-foreground hover:underline">
          ← Go home
        </Link>
      </div>
    );
  }

  const { eventType } = booking;
  const host = eventType.user;
  const bookUrl = `/book/${eventType.slug}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-6 py-4">
        <Link
          href={bookUrl}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to booking
        </Link>
      </div>

      <div className="flex justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          <div className="rounded-xl border border-border bg-card px-6 py-8 shadow-lg sm:px-8">
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h1 className="mt-4 text-xl font-semibold">This meeting is scheduled</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your booking details are below.
              </p>
            </div>

            <div className="mt-8 space-y-6 border-t border-border pt-8">
              <DetailRow label="What">
                {eventType.durationMinutes} min meeting between {host.name} and{" "}
                {booking.attendeeName}
              </DetailRow>

              <DetailRow label="When">
                <p>{formatBookingDate(booking.startTime)}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatBookingTimeRange(booking.startTime, booking.endTime)}
                </p>
              </DetailRow>

              <DetailRow label="Who">
                <div className="space-y-4">
                  <PersonLine
                    name={host.name}
                    email={host.email ?? "host@example.com"}
                    badge="Host"
                    badgeClass="bg-blue-500/15 text-blue-400"
                  />
                  <PersonLine
                    name={booking.attendeeName}
                    email={booking.attendeeEmail}
                    badge="Guest"
                    badgeClass="bg-amber-500/15 text-amber-400"
                  />
                </div>
              </DetailRow>

              <DetailRow label="Where">
                {(() => {
                  const joinUrl = resolveMeetingUrl(booking.id, booking.meetingUrl);
                  const external = joinUrl.startsWith("http");
                  const label = meetingProviderLabel(booking.meetingProvider);
                  return (
                    <Link
                      href={joinUrl}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      {label}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  );
                })()}
              </DetailRow>

              {booking.status === "CONFIRMED" && (
                <DetailRow label="Need to change?">
                  <Link
                    href={`/book/${eventType.slug}?reschedule=${booking.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    Reschedule this booking
                  </Link>
                </DetailRow>
              )}
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">Cal.com</p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<ConfirmationPageSkeleton />}>
      <ConfirmedContent />
    </Suspense>
  );
}
