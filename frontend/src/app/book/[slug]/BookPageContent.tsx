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

function buildBookingPath(
  slug: string,
  params: {
    preview?: boolean;
    reschedule?: string | null;
    date?: string | null;
    slot?: string | null;
  },
): string {
  const q = new URLSearchParams();
  if (params.preview) q.set("preview", "1");
  if (params.reschedule) q.set("reschedule", params.reschedule);
  if (params.date) q.set("date", params.date);
  if (params.slot) q.set("slot", params.slot);
  const qs = q.toString();
  return `/book/${slug}${qs ? `?${qs}` : ""}`;
}

export function BookPageContent({ slug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewParam = searchParams.get("preview") === "1";
  const rescheduleId = searchParams.get("reschedule");
  const urlDate = searchParams.get("date");
  const urlSlot = searchParams.get("slot");
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

  const pushBookingUrl = useCallback(
    (patch: { date?: string | null; slot?: string | null }, replace = false) => {
      const nextDate =
        patch.date === undefined ? urlDate : patch.date;
      const nextSlot =
        patch.slot === undefined ? urlSlot : patch.slot;
      const path = buildBookingPath(slug, {
        preview: needsPreviewApi,
        reschedule: rescheduleId,
        date: nextDate,
        slot: nextSlot,
      });
      if (replace) {
        router.replace(path, { scroll: false });
      } else {
        router.push(path, { scroll: false });
      }
    },
    [slug, needsPreviewApi, rescheduleId, urlDate, urlSlot, router],
  );

  const applyBootstrap = useCallback((data: BookingBootstrapResponse) => {
    setEvent(data.event);
    setTimezone(data.timezone);
    setMeetingProvider(data.preferredMeetingProvider ?? "CAL_VIDEO");
    setAvailableDates(new Set(data.availableDates));
    slotsByDateRef.current = data.slotsByDate ?? {};
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

  const loadSlotsForDate = useCallback(
    async (dateKey: string) => {
      const cached = slotsByDateRef.current[dateKey];
      if (cached) {
        setSlots(cached);
        return cached;
      }
      setSlotsLoading(true);
      try {
        const { slots: daySlots } = await getSlots(slug, dateKey, needsPreviewApi);
        slotsByDateRef.current[dateKey] = daySlots;
        setSlots(daySlots);
        return daySlots;
      } catch {
        setSlots([]);
        return [];
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug, needsPreviewApi],
  );

  useEffect(() => {
    if (calendarLoading) return;

    if (!urlDate) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlots([]);
      return;
    }

    let cancelled = false;
    const date = parseISO(urlDate);
    if (Number.isNaN(date.getTime())) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlots([]);
      return;
    }

    setSelectedDate(date);
    setMonth(startOfMonth(date));

    void loadSlotsForDate(urlDate).then((daySlots) => {
      if (cancelled) return;
      if (urlSlot) {
        const match = daySlots.find((s) => s.startTime === urlSlot) ?? null;
        setSelectedSlot(match);
      } else {
        setSelectedSlot(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [urlDate, urlSlot, calendarLoading, loadSlotsForDate]);

  function handleSelectDate(date: Date) {
    const key = toDateKey(date);
    pushBookingUrl({ date: key, slot: null });
  }

  function handleSelectSlot(slot: Slot) {
    if (!selectedDate) return;
    pushBookingUrl({ date: toDateKey(selectedDate), slot: slot.startTime });
  }

  function handleBack() {
    if (selectedSlot) {
      if (selectedDate) {
        pushBookingUrl({ date: toDateKey(selectedDate), slot: null }, true);
      } else {
        setSelectedSlot(null);
      }
      return;
    }
    if (selectedDate) {
      pushBookingUrl({ date: null, slot: null }, true);
      return;
    }
    router.push("/book");
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
        if (selectedDate) {
          delete slotsByDateRef.current[toDateKey(selectedDate)];
          void loadSlotsForDate(toDateKey(selectedDate));
        }
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
          href="/book"
          className="mt-4 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to events
        </Link>
      </div>
    );
  }

  const showingForm = Boolean(selectedSlot && selectedDate);
  const showBackNav = Boolean(selectedDate);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-6 py-4">
        {showBackNav ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {showingForm
              ? "Back to time slots"
              : "Back to calendar"}
          </button>
        ) : (
          <Link
            href="/book"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            All events
          </Link>
        )}
      </div>

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
                      pushBookingUrl({ date: null, slot: null }, true);
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
                    onSelect={handleSelectSlot}
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
                  onBack={handleBack}
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
