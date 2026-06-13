"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Video } from "lucide-react";
import { getBooking } from "@/lib/api";
import type { BookingWithEvent } from "@/lib/types";
import { formatBookingDate, formatBookingTimeRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function VideoRoomContent() {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading meeting…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p className="text-lg font-medium text-destructive">
          The meeting you&apos;re trying to join does not exist
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Contact the meeting host for help.</p>
        <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const { eventType } = booking;
  const cancelled = booking.status === "CANCELLED";
  const confirmUrl = `/booking/confirmed?id=${booking.id}`;
  const bookUrl = `/book/${eventType.slug}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-6 py-4">
        <Link
          href={confirmUrl}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to booking
        </Link>
      </div>

      <div className="flex justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Video className="h-7 w-7 text-muted-foreground" />
          </div>

          {cancelled ? (
            <>
              <h1 className="mt-6 text-xl font-semibold text-destructive">
                This meeting has been cancelled
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This booking is no longer active.
              </p>
              <Button variant="link" asChild className="mt-4">
                <Link href={bookUrl}>Book a new time</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-xl font-semibold">{eventType.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatBookingDate(booking.startTime)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBookingTimeRange(booking.startTime, booking.endTime)}
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                Video conferencing is not integrated in this clone. In production, this
                page would open your Cal Video room.
              </p>
              <Button disabled className="mt-6">
                Join meeting
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VideoRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <VideoRoomContent />
    </Suspense>
  );
}
