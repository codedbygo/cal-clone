"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cancelBooking, getBookings } from "@/lib/api";
import { BookingRow } from "@/components/bookings/BookingRow";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [cancelTarget, setCancelTarget] = useState<BookingListItem | null>(null);

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

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget.id);
    try {
      await cancelBooking(cancelTarget.id);
      setBookings((prev) => prev.filter((b) => b.id !== cancelTarget.id));
      setCancelTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <AdminPageShell
      title="Bookings"
      description="Bookings created through your public event pages."
      headerExtra={
        <div className="mt-4 inline-flex rounded-lg border border-border bg-muted p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors",
                tab === id
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {loading && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse px-4 py-4",
                i < 2 && "border-b border-border",
              )}
            >
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="mt-2 h-3 w-56 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-medium text-foreground">
            {tab === "upcoming" && "No upcoming bookings"}
            {tab === "past" && "No past bookings"}
            {tab === "cancelled" && "No cancelled bookings"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {tab === "upcoming" &&
              "When someone books via your public link, it appears here."}
            {tab === "past" && "Past meetings will show here after their scheduled time."}
            {tab === "cancelled" &&
              "Bookings you cancel from the Upcoming tab will appear here."}
          </p>
          {tab === "upcoming" && (
            <Button variant="link" asChild className="mt-4">
              <Link href="/event-types">View event types →</Link>
            </Button>
          )}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {bookings.map((b, index) => (
            <BookingRow
              key={b.id}
              booking={b}
              isLast={index === bookings.length - 1}
              showCancel={tab === "upcoming"}
              showCancelledBadge={tab === "cancelled"}
              cancelling={cancellingId === b.id}
              onCancel={() => setCancelTarget(b)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel booking?"
        description="The time slot will become available again on your public booking page."
        confirmLabel="Cancel booking"
        loading={Boolean(cancellingId)}
        destructive
        onConfirm={handleCancelConfirm}
        onClose={() => !cancellingId && setCancelTarget(null)}
      />
    </AdminPageShell>
  );
}
