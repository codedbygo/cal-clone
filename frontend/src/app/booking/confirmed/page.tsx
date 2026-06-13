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
  getCalVideoPath,
} from "@/lib/utils";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[5rem_1fr] sm:gap-6">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <div className="text-sm text-white">{children}</div>
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
        <span className="font-medium">{name}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-0.5 text-[#9ca3af]">{email}</p>
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101010]">
        <p className="text-sm text-[#9ca3af]">Loading confirmation…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#101010] p-8 text-white">
        <p className="text-lg font-medium">Booking not found</p>
        <Link href="/" className="mt-4 text-sm text-[#9ca3af] hover:text-white hover:underline">
          ← Go home
        </Link>
      </div>
    );
  }

  const { eventType } = booking;
  const host = eventType.user;
  const bookUrl = `/book/${eventType.slug}`;
  const videoPath = getCalVideoPath(booking.id);

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <div className="px-6 py-4">
        <Link
          href={bookUrl}
          className="inline-flex items-center gap-1 text-sm text-[#9ca3af] transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to booking
        </Link>
      </div>

      <div className="flex justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] px-6 py-8 shadow-2xl sm:px-8">
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
            </div>
            <h1 className="mt-4 text-xl font-semibold">This meeting is scheduled</h1>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Your booking details are below.
            </p>
          </div>

          <div className="mt-8 space-y-6 border-t border-[#2a2a2a] pt-8">
            <DetailRow label="What">
              {eventType.durationMinutes} min meeting between {host.name} and{" "}
              {booking.attendeeName}
            </DetailRow>

            <DetailRow label="When">
              <p>{formatBookingDate(booking.startTime)}</p>
              <p className="mt-1 text-[#9ca3af]">
                {formatBookingTimeRange(booking.startTime, booking.endTime)}
              </p>
            </DetailRow>

            <DetailRow label="Who">
              <div className="space-y-4">
                <PersonLine
                  name={host.name}
                  email={host.email ?? "host@example.com"}
                  badge="Host"
                  badgeClass="bg-blue-500/20 text-blue-300"
                />
                <PersonLine
                  name={booking.attendeeName}
                  email={booking.attendeeEmail}
                  badge="Guest"
                  badgeClass="bg-amber-500/20 text-amber-300"
                />
              </div>
            </DetailRow>

            <DetailRow label="Where">
              <Link
                href={videoPath}
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                Cal Video
                <ExternalLink className="h-3.5 w-3.5 text-[#9ca3af]" />
              </Link>
            </DetailRow>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#6b7280]">cal-clone</p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#101010]">
          <p className="text-sm text-[#9ca3af]">Loading…</p>
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  );
}
