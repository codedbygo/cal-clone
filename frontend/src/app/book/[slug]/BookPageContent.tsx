"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth } from "date-fns";
import {
  BookingCalendar,
  formatSelectedDay,
  toDateKey,
} from "@/components/booking/BookingCalendar";
import { BookingEventInfo } from "@/components/booking/BookingEventInfo";
import { BookingForm } from "@/components/booking/BookingForm";
import { TimeSlotList } from "@/components/booking/TimeSlotList";
import { createBooking, getBookingBootstrap } from "@/lib/api";
import type { BookingBootstrapResponse, EventTypeWithHost, Slot } from "@/lib/types";

interface Props {
  slug: string;
}

export function BookPageContent({ slug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewParam = searchParams.get("preview") === "1";
  const needsPreviewApi = isPreviewParam;

  const [event, setEvent] = useState<EventTypeWithHost | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const slotsByDateRef = useRef<Record<string, Slot[]>>({});

  const monthKey = format(month, "yyyy-MM");

  const applyBootstrap = useCallback((data: BookingBootstrapResponse) => {
    setEvent(data.event);
    setTimezone(data.timezone);
    setAvailableDates(new Set(data.availableDates));
    slotsByDateRef.current = data.slotsByDate ?? {};
    const date = data.selectedDate ? parseISO(data.selectedDate) : null;
    setSelectedDate(date);
    if (date) {
      setSlots(slotsByDateRef.current[toDateKey(date)] ?? data.slots);
    } else {
      setSlots([]);
    }
  }, []);

  useEffect(() => {
    setCalendarLoading(true);
    setError(null);

    getBookingBootstrap(slug, monthKey, needsPreviewApi)
      .then(applyBootstrap)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setCalendarLoading(false));
  }, [slug, monthKey, needsPreviewApi, applyBootstrap]);

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    const key = toDateKey(date);
    const cached = slotsByDateRef.current[key];
    if (cached) {
      setSlots(cached);
    }
  }

  if (error && !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
        <p className="text-lg font-medium text-gray-900">Event not found</p>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Link
          href="/event-types"
          className="mt-4 text-sm text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const showingForm = Boolean(selectedSlot && selectedDate);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {showingForm && (
        <div className="px-6 py-4">
          <button
            type="button"
            onClick={() => setSelectedSlot(null)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to booking
          </button>
        </div>
      )}

      <div className="px-4 pb-8">
      {isPreviewParam && event?.hidden && (
        <div className="mx-auto mb-4 max-w-5xl rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          Preview mode — this event is not publicly visible yet.
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div
            className={
              showingForm
                ? "grid lg:grid-cols-2"
                : "grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]"
            }
          >
            {event ? (
              <BookingEventInfo
                event={event}
                timezone={timezone}
                selectedDayLabel={
                  showingForm && selectedDate
                    ? formatSelectedDay(selectedDate)
                    : undefined
                }
                selectedStartTime={selectedSlot?.startTime}
                selectedEndTime={selectedSlot?.endTime}
              />
            ) : (
              <div className="animate-pulse p-6 lg:p-8">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="mt-6 h-6 w-32 rounded bg-gray-200" />
                <div className="mt-4 h-4 w-24 rounded bg-gray-100" />
              </div>
            )}

            {!showingForm && (
              <>
                <BookingCalendar
                  month={month}
                  selected={selectedDate}
                  availableDates={availableDates}
                  loading={calendarLoading && availableDates.size === 0}
                  onMonthChange={(m) => {
                    setMonth(startOfMonth(m));
                    setSelectedDate(null);
                    setSlots([]);
                    setSelectedSlot(null);
                    slotsByDateRef.current = {};
                    setCalendarLoading(true);
                  }}
                  onSelect={handleSelectDate}
                />

                <TimeSlotList
                  dayLabel={selectedDate ? formatSelectedDay(selectedDate) : null}
                  slots={slots}
                  loading={calendarLoading && slots.length === 0}
                  timezone={timezone}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                />
              </>
            )}

            {showingForm && selectedSlot && (
              <BookingForm
                onBack={() => setSelectedSlot(null)}
                onSubmit={async ({ name, email }) => {
                  if (!event) return;
                  const booking = await createBooking({
                    eventTypeId: event.id,
                    attendeeName: name,
                    attendeeEmail: email,
                    startTime: selectedSlot.startTime,
                  });
                  router.push(`/booking/confirmed?id=${booking.id}`);
                }}
              />
            )}
          </div>

          <div className="border-t border-gray-200 py-3 text-center text-xs text-gray-400">
            Cal.com
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
