import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export interface Slot {
  time: string;
  startTime: string;
  endTime: string;
}

export interface GenerateSlotsInput {
  date: string;
  durationMinutes: number;
  timezone: string;
  rule: { startTime: string; endTime: string } | null;
  bookings: { startTime: Date; endTime: Date }[];
  now?: Date;
}

function format12h(date: Date, timezone: string): string {
  const raw = formatInTimeZone(date, timezone, "h:mma");
  return raw.replace(":00", "").toLowerCase();
}

export function generateSlots(input: GenerateSlotsInput): Slot[] {
  const {
    date,
    durationMinutes,
    timezone,
    rule,
    bookings,
    now = new Date(),
  } = input;

  if (!rule) return [];

  const windowStart = fromZonedTime(`${date}T${rule.startTime}:00`, timezone);
  const windowEnd = fromZonedTime(`${date}T${rule.endTime}:00`, timezone);
  const stepMs = durationMinutes * 60_000;

  const slots: Slot[] = [];
  let cursor = windowStart;

  while (cursor.getTime() + stepMs <= windowEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + stepMs);
    const isPast = cursor <= now;
    const overlaps = bookings.some(
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
