import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export interface Slot {
  time: string;
  startTime: string;
  endTime: string;
}

export interface BookingBlock {
  startTime: Date;
  endTime: Date;
}

export interface AvailabilityOverrideLike {
  date: string;
  type: "UNAVAILABLE" | "CUSTOM_HOURS";
  startTime: string | null;
  endTime: string | null;
}

export interface GenerateSlotsInput {
  date: string;
  durationMinutes: number;
  timezone: string;
  rule: { startTime: string; endTime: string } | null;
  bookings: BookingBlock[];
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  now?: Date;
}

function format12h(date: Date, timezone: string): string {
  const raw = formatInTimeZone(date, timezone, "h:mma");
  return raw.replace(":00", "").toLowerCase();
}

export function expandBookingWithBuffer(
  booking: BookingBlock,
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
): BookingBlock {
  return {
    startTime: new Date(
      booking.startTime.getTime() - bufferBeforeMinutes * 60_000,
    ),
    endTime: new Date(booking.endTime.getTime() + bufferAfterMinutes * 60_000),
  };
}

export function resolveDayRule(
  date: string,
  dayOfWeek: number,
  rules: { dayOfWeek: number; startTime: string; endTime: string }[],
  overrides: AvailabilityOverrideLike[],
): { startTime: string; endTime: string } | null {
  const override = overrides.find((o) => o.date === date);
  if (override?.type === "UNAVAILABLE") return null;
  if (override?.type === "CUSTOM_HOURS" && override.startTime && override.endTime) {
    return { startTime: override.startTime, endTime: override.endTime };
  }
  const rule = rules.find((r) => r.dayOfWeek === dayOfWeek) ?? null;
  return rule ? { startTime: rule.startTime, endTime: rule.endTime } : null;
}

export function generateSlots(input: GenerateSlotsInput): Slot[] {
  const {
    date,
    durationMinutes,
    timezone,
    rule,
    bookings,
    bufferBeforeMinutes = 0,
    bufferAfterMinutes = 0,
    now = new Date(),
  } = input;

  if (!rule) return [];

  const windowStart = fromZonedTime(`${date}T${rule.startTime}:00`, timezone);
  const windowEnd = fromZonedTime(`${date}T${rule.endTime}:00`, timezone);
  const stepMs = durationMinutes * 60_000;

  const blocked = bookings.map((b) =>
    expandBookingWithBuffer(b, bufferBeforeMinutes, bufferAfterMinutes),
  );

  const slots: Slot[] = [];
  let cursor = windowStart;

  while (cursor.getTime() + stepMs <= windowEnd.getTime()) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    const isPast = cursor <= now;
    const overlaps = blocked.some(
      (b) => cursor < b.endTime && slotEnd > b.startTime,
    );

    if (!isPast && !overlaps) {
      slots.push({
        time: format12h(cursor, timezone),
        startTime: cursor.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }

    cursor = slotEnd;
  }

  return slots;
}
