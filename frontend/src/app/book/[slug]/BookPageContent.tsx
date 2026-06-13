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
import {
  createBooking,
  getBooking,
  getBookingBootstrap,
  getSlots,
  rescheduleBooking,
  ApiClientError,
} from "@/lib/api";
import type { BookingBootstrapResponse, CustomQuestion, EventTypeWithHost, MeetingProvider, Slot } from "@/lib/types";

interface Props {
  slug: string;
}

export function BookPageContent({ slug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewParam = searchParams.get("preview") === "1";
  const rescheduleId = searchParams.get("reschedule");
  const needsPreviewApi = isPreviewParam;

  const [event, setEvent] = useState<EventTypeWithHost | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider>("CAL_VIDEO");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slotsByDateRef = useRef<Record<string, Slot[]>>({});

  const monthKey = format(month, "yyyy-MM");
  const isReschedule = Boolean(rescheduleId);

  const customQuestions: CustomQuestion[] = Array.isArray(event?.customQuestions)
    ? event.customQuestions
    : [];

  const applyBootstrap = useCallback((data: BookingBootstrapResponse) => {
    setEvent(data.event);
    setTimezone(data.timezone);
    setMeetingProvider(data.preferredMeetingProvider ?? "CAL_VIDEO");
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
    if (!rescheduleId) return;
    getBooking(rescheduleId)
      .then((b) => {
        setGuestName(b.attendeeName);
        setGuestEmail(b.attendeeEmail);
        if (b.answers && typeof b.answers === "object") {
          setAnswers(b.answers as Record<string, string>);
        }
      })
      .catch(() => setError("Could not load booking to reschedule"));
  }, [rescheduleId]);

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
      return;
    }
    setSlotsLoading(true);
    void getSlots(slug, key, needsPreviewApi)
      .then(({ slots: daySlots }) => {
        slotsByDateRef.current[key] = daySlots;
        setSlots(daySlots);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }

  async function handleFormSubmit() {
    if (!event || !selectedSlot) return;
    setFormError(null);
    setSubmitting(true);
    try {
      if (isReschedule && rescheduleId) {
        const booking = await rescheduleBooking(rescheduleId, selectedSlot.startTime);
        router.push(`/booking/confirmed?id=${booking.id}`);
      } else {
        const booking = await createBooking({
          eventTypeId: event.id,
          attendeeName: guestName.trim(),
          attendeeEmail: guestEmail.trim(),
          startTime: selectedSlot.startTime,
          answers,
        });
        router.push(`/booking/confirmed?id=${booking.id}`);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "SLOT_TAKEN") {
        setFormError("That time was just taken. Please pick another slot.");
      } else {
        setFormError(err instanceof Error ? err.message : "Booking failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p className="text-lg font-medium text-foreground">Event not found</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Link
          href="/event-types"
          className="mt-4 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const showingForm = Boolean(selectedSlot && selectedDate);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showingForm && (
        <div className="px-6 py-4">
          <button
            type="button"
            onClick={() => setSelectedSlot(null)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {isReschedule ? "reschedule" : "booking"}
          </button>
        </div>
      )}

      <div className="px-4 pb-8">
        {isReschedule && (
          <div className="mx-auto mb-4 max-w-5xl rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-center text-sm text-blue-400">
            Reschedule mode — pick a new date and time.
          </div>
        )}

        {isPreviewParam && event?.hidden && (
          <div className="mx-auto mb-4 max-w-5xl rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-400">
            Preview mode — this event is not publicly visible yet.
          </div>
        )}

        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
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
                  meetingProvider={meetingProvider}
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
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="mt-6 h-6 w-32 rounded bg-muted" />
                  <div className="mt-4 h-4 w-24 rounded bg-muted/60" />
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
                    loading={slotsLoading || (calendarLoading && slots.length === 0)}
                    timezone={timezone}
                    selectedSlot={selectedSlot}
                    onSelect={setSelectedSlot}
                  />
                </>
              )}

              {showingForm && selectedSlot && (
                <BookingForm
                  customQuestions={isReschedule ? [] : customQuestions}
                  answers={answers}
                  onChange={setAnswers}
                  guestName={guestName}
                  guestEmail={guestEmail}
                  onGuestChange={(name, email) => {
                    setGuestName(name);
                    setGuestEmail(email);
                  }}
                  readOnlyGuest={isReschedule}
                  onBack={() => setSelectedSlot(null)}
                  onSubmit={handleFormSubmit}
                  submitting={submitting}
                  error={formError}
                  submitLabel={isReschedule ? "Confirm reschedule" : "Confirm"}
                />
              )}
            </div>

            <div className="border-t border-border py-3 text-center text-xs text-muted-foreground">
              Cal.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
