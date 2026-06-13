"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cancelBooking, getBookings } from "@/lib/api";
import { BookingRow } from "@/components/bookings/BookingRow";
import type { BookingFilter, BookingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: BookingFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingFilter>("upcoming");
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async (filter: BookingFilter) => {
    setError(null);
    setLoading(true);
    try {
      const data = await getBookings(filter);
      setBookings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function handleCancel(id: string) {
    if (
      !confirm(
        "Cancel this booking? The time slot will become available again on the public page.",
      )
    ) {
      return;
    }
    setCancellingId(id);
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--cal-border)] px-8 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-[var(--cal-muted)]">
          Bookings created through your public event pages.
        </p>

        <div className="mt-4 inline-flex rounded-full border border-[var(--cal-border)] bg-[#101010] p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                tab === id
                  ? "bg-white font-medium text-black"
                  : "text-[var(--cal-muted)] hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 px-8 py-6">
        {loading && (
          <div className="overflow-hidden rounded-lg border border-[var(--cal-border)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse border-b border-[var(--cal-border)] px-4 py-6 last:border-b-0"
              >
                <div className="h-4 w-40 rounded bg-[#2a2a2a]" />
                <div className="mt-2 h-3 w-56 rounded bg-[#2a2a2a]" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="py-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <p className="mt-1 text-sm text-[var(--cal-muted)]">
              Is the backend running on port 4000?
            </p>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a]">
              <CalendarDays className="h-7 w-7 text-[var(--cal-muted)]" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-white">
              {tab === "upcoming" && "No upcoming bookings"}
              {tab === "past" && "No past bookings"}
              {tab === "cancelled" && "No cancelled bookings"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[var(--cal-muted)]">
              {tab === "upcoming" &&
                "When someone books via your public link, it appears here. Try booking yourself at an event type page."}
              {tab === "past" &&
                "Past meetings will show here after their scheduled time."}
              {tab === "cancelled" &&
                "Bookings you cancel from the Upcoming tab will appear here."}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/event-types"
                className="mt-6 text-sm text-white underline underline-offset-4 hover:text-[var(--cal-muted)]"
              >
                View event types →
              </Link>
            )}
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-[var(--cal-border)]">
            {bookings.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                showCancel={tab === "upcoming"}
                showCancelledBadge={tab === "cancelled"}
                cancelling={cancellingId === b.id}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
