"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth } from "date-fns";
import {
  BookingCalendar,
  formatSelectedDay,
  toDateKey,
} from "@/components/booking/BookingCalendar";
import { BookingEventInfo } from "@/components/booking/BookingEventInfo";
import { TimeSlotList } from "@/components/booking/TimeSlotList";
import { getEventBySlug, getMonthAvailability, getSlots } from "@/lib/api";
import type { EventTypeWithHost, Slot } from "@/lib/types";

interface Props {
  slug: string;
}

export function BookPageContent({ slug }: Props) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  const [event, setEvent] = useState<EventTypeWithHost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [timezone, setTimezone] = useState("UTC");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const monthKey = format(month, "yyyy-MM");

  const loadMonth = useCallback(async () => {
    try {
      const data = await getMonthAvailability(slug, monthKey, isPreview);
      setTimezone(data.timezone);
      return new Set(data.availableDates);
    } catch {
      return new Set<string>();
    }
  }, [slug, monthKey, isPreview]);

  useEffect(() => {
    setLoading(true);
    getEventBySlug(slug, isPreview)
      .then(setEvent)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [slug, isPreview]);

  useEffect(() => {
    if (!event) return;
    loadMonth().then((dates) => {
      setAvailableDates(dates);
      setSelectedDate((prev) => {
        if (prev && dates.has(toDateKey(prev))) return prev;
        if (dates.size === 0) return null;
        return parseISO(Array.from(dates).sort()[0]!);
      });
    });
  }, [event, loadMonth]);

  useEffect(() => {
    if (!selectedDate || !event) return;

    const dateKey = toDateKey(selectedDate);
    setSlotsLoading(true);
    setSelectedSlot(null);
    getSlots(slug, dateKey, isPreview)
      .then((data) => {
        setTimezone(data.timezone);
        setSlots(data.slots);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, slug, isPreview, event]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101010]">
        <p className="text-sm text-[#9ca3af]">Loading…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#101010] p-8">
        <p className="text-lg font-medium text-white">Event not found</p>
        <p className="mt-1 text-sm text-[#9ca3af]">
          This event may be hidden or does not exist.
        </p>
        <Link
          href="/event-types"
          className="mt-4 text-sm text-[#9ca3af] hover:text-white hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] px-4 py-8 text-white">
      {isPreview && (
        <div className="mx-auto mb-4 max-w-5xl rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          Preview mode — this event is not publicly visible yet.
        </div>
      )}

      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#101010] shadow-2xl">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
          <BookingEventInfo event={event} timezone={timezone} />
          <BookingCalendar
            month={month}
            selected={selectedDate}
            availableDates={availableDates}
            onMonthChange={(m) => {
              setMonth(startOfMonth(m));
              setSelectedDate(null);
              setSlots([]);
              setSelectedSlot(null);
            }}
            onSelect={setSelectedDate}
          />
          <TimeSlotList
            dayLabel={selectedDate ? formatSelectedDay(selectedDate) : null}
            slots={slots}
            loading={slotsLoading}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />
        </div>

        <div className="border-t border-[#2a2a2a] py-3 text-center text-xs text-[#6b7280]">
          cal-clone
        </div>
      </div>
    </div>
  );
}
