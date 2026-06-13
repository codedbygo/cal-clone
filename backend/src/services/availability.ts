import {
  addDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { AvailabilityRule } from "@prisma/client";
import {
  generateSlots,
  resolveDayRule,
  type AvailabilityOverrideLike,
  type BookingBlock,
  type Slot,
} from "./slots";

interface MonthInput {
  month: string;
  durationMinutes: number;
  timezone: string;
  rules: AvailabilityRule[];
  overrides: AvailabilityOverrideLike[];
  bookings: BookingBlock[];
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

export function computeMonthAvailability(input: MonthInput): string[] {
  const {
    month,
    durationMinutes,
    timezone,
    rules,
    overrides,
    bookings,
    bufferBeforeMinutes,
    bufferAfterMinutes,
  } = input;
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
      overrides,
      bookings,
      bufferBeforeMinutes,
      bufferAfterMinutes,
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
  overrides: AvailabilityOverrideLike[];
  bookings: BookingBlock[];
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

export function computeDaySlots(input: DayInput): Slot[] {
  const {
    date,
    durationMinutes,
    timezone,
    rules,
    overrides,
    bookings,
    bufferBeforeMinutes,
    bufferAfterMinutes,
  } = input;
  const noonUtc = fromZonedTime(`${date}T12:00:00`, timezone);
  const dayOfWeek = toZonedTime(noonUtc, timezone).getDay();
  const rule = resolveDayRule(date, dayOfWeek, rules, overrides);
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
    rule,
    bookings: dayBookings,
    bufferBeforeMinutes,
    bufferAfterMinutes,
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
