import {
  addDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { AvailabilityRule } from "@prisma/client";
import { generateSlots, type Slot } from "./slots";

interface MonthInput {
  month: string;
  durationMinutes: number;
  timezone: string;
  rules: AvailabilityRule[];
  bookings: { startTime: Date; endTime: Date }[];
}

export function computeMonthAvailability(input: MonthInput): string[] {
  const { month, durationMinutes, timezone, rules, bookings } = input;
  const monthStart = parseISO(`${month}-01`);
  const monthEnd = endOfMonth(monthStart);
  const availableDates: string[] = [];

  for (
    let day = startOfMonth(monthStart);
    day <= monthEnd;
    day = addDays(day, 1)
  ) {
    const dateStr = format(day, "yyyy-MM-dd");
    const slots = computeDaySlots({
      date: dateStr,
      durationMinutes,
      timezone,
      rules,
      bookings,
    });
    if (slots.length > 0) availableDates.push(dateStr);
  }

  return availableDates;
}

interface DayInput {
  date: string;
  durationMinutes: number;
  timezone: string;
  rules: AvailabilityRule[];
  bookings: { startTime: Date; endTime: Date }[];
}

export function computeDaySlots(input: DayInput): Slot[] {
  const { date, durationMinutes, timezone, rules, bookings } = input;
  const noonUtc = fromZonedTime(`${date}T12:00:00`, timezone);
  const dayOfWeek = toZonedTime(noonUtc, timezone).getDay();
  const rule = rules.find((r) => r.dayOfWeek === dayOfWeek) ?? null;
  if (!rule) return [];

  const dayStart = fromZonedTime(`${date}T00:00:00`, timezone);
  const dayEnd = fromZonedTime(`${date}T23:59:59`, timezone);
  const dayBookings = bookings.filter(
    (b) => b.startTime < dayEnd && b.endTime > dayStart,
  );

  return generateSlots({
    date,
    durationMinutes,
    timezone,
    rule: { startTime: rule.startTime, endTime: rule.endTime },
    bookings: dayBookings,
  });
}

export function monthRangeUtc(month: string, timezone: string) {
  const monthStart = parseISO(`${month}-01`);
  const monthEnd = endOfMonth(monthStart);
  return {
    monthStart,
    monthEnd,
    rangeStart: fromZonedTime(
      `${format(monthStart, "yyyy-MM-dd")}T00:00:00`,
      timezone,
    ),
    rangeEnd: fromZonedTime(
      `${format(monthEnd, "yyyy-MM-dd")}T23:59:59`,
      timezone,
    ),
  };
}
