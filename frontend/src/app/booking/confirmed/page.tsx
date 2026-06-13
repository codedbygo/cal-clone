"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Calendar, Clock, Mail, User } from "lucide-react";
import { getBooking } from "@/lib/api";
import type { BookingWithEvent } from "@/lib/types";

function formatLocalTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101010] px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#101010] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <Check className="h-7 w-7 text-emerald-400" strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 text-xl font-semibold">Booking confirmed</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">
            You are scheduled with {eventType.user.name}
          </p>
        </div>

        <div className="mt-8 space-y-4 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
            <div>
              <p className="font-medium">{eventType.title}</p>
              <p className="mt-0.5 text-sm text-[#9ca3af]">
                {formatLocalTime(booking.startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{eventType.durationMinutes} minutes</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
            <User className="h-4 w-4 shrink-0" />
            <span>{booking.attendeeName}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
            <Mail className="h-4 w-4 shrink-0" />
            <span>{booking.attendeeEmail}</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#6b7280]">cal-clone</div>
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
