"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cancelBooking, getBookings } from "@/lib/api";
import { BookingRow } from "@/components/bookings/BookingRow";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
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
    <AdminPageShell
      title="Bookings"
      description="Bookings created through your public event pages."
      headerExtra={
        <div className="mt-4 inline-flex rounded-lg border border-[var(--cal-border)] bg-[var(--cal-card)] p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors",
                tab === id
                  ? "bg-[var(--cal-primary)] font-medium text-[var(--cal-primary-fg)]"
                  : "text-[var(--cal-muted)] hover:text-[var(--cal-text)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--cal-border)] bg-[var(--cal-card)] p-4"
            >
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-56 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-300 bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <CalendarDays className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">
            {tab === "upcoming" && "No upcoming bookings"}
            {tab === "past" && "No past bookings"}
            {tab === "cancelled" && "No cancelled bookings"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            {tab === "upcoming" &&
              "When someone books via your public link, it appears here."}
            {tab === "past" && "Past meetings will show here after their scheduled time."}
            {tab === "cancelled" &&
              "Bookings you cancel from the Upcoming tab will appear here."}
          </p>
          {tab === "upcoming" && (
            <Link
              href="/event-types"
              className="mt-6 text-sm font-medium text-gray-900 underline underline-offset-4"
            >
              View event types →
            </Link>
          )}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-3">
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
    </AdminPageShell>
  );
}
