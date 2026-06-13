"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Video } from "lucide-react";
import { getBooking } from "@/lib/api";
import type { BookingWithEvent } from "@/lib/types";
import { formatBookingDate, formatBookingTimeRange } from "@/lib/utils";

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
      <div className="flex min-h-screen items-center justify-center bg-[#101010]">
        <p className="text-sm text-[#9ca3af]">Loading meeting…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#101010] p-8 text-white">
        <p className="text-lg font-medium text-red-400">
          The meeting you&apos;re trying to join does not exist
        </p>
        <p className="mt-2 text-sm text-[#9ca3af]">Contact the meeting host for help.</p>
        <Link href="/" className="mt-6 text-sm text-[#9ca3af] hover:text-white hover:underline">
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
    <div className="min-h-screen bg-[#101010] text-white">
      <div className="px-6 py-4">
        <Link
          href={confirmUrl}
          className="inline-flex items-center gap-1 text-sm text-[#9ca3af] transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to booking
        </Link>
      </div>

      <div className="flex justify-center px-4 pb-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a]">
            <Video className="h-7 w-7 text-[#9ca3af]" />
          </div>

          {cancelled ? (
            <>
              <h1 className="mt-6 text-xl font-semibold text-red-400">
                This meeting has been cancelled
              </h1>
              <p className="mt-2 text-sm text-[#9ca3af]">
                This booking is no longer active.
              </p>
              <Link
                href={bookUrl}
                className="mt-6 inline-block text-sm text-white underline underline-offset-4 hover:text-[#9ca3af]"
              >
                Book a new time
              </Link>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-xl font-semibold">{eventType.title}</h1>
              <p className="mt-2 text-sm text-[#9ca3af]">
                {formatBookingDate(booking.startTime)}
              </p>
              <p className="mt-1 text-sm text-[#9ca3af]">
                {formatBookingTimeRange(booking.startTime, booking.endTime)}
              </p>
              <p className="mt-6 text-sm text-[#6b7280]">
                Video conferencing is not integrated in this clone. In production,
                this page would open your Cal Video room.
              </p>
              <button
                type="button"
                disabled
                className="mt-6 cursor-not-allowed rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-[#6b7280]"
              >
                Join meeting
              </button>
            </>
          )}

          <p className="mt-12 text-xs text-[#6b7280]">cal-clone</p>
        </div>
      </div>
    </div>
  );
}

export default function VideoRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#101010]">
          <p className="text-sm text-[#9ca3af]">Loading…</p>
        </div>
      }
    >
      <VideoRoomContent />
    </Suspense>
  );
}
