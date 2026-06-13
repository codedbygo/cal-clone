import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Format slot start time for booking UI (12h: 9:30am, 24h: 09:30). */
export function formatSlotTime(
  iso: string,
  timezone: string,
  use24h: boolean,
): string {
  const d = new Date(iso);
  if (use24h) {
    return d.toLocaleTimeString("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const raw = d
    .toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(/\s/g, "");
  return raw.replace(":00", "");
}

/** e.g. "Friday, June 19, 2026" */
export function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** e.g. "11:00 AM - 11:30 AM (India Standard Time)" */
export function formatBookingTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const tz =
    new Intl.DateTimeFormat(undefined, { timeZoneName: "long" })
      .formatToParts(start)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  return `${fmt(start)} - ${fmt(end)}${tz ? ` (${tz})` : ""}`;
}

/** e.g. "Friday, June 19, 2026, 11:00 – 11:30 am" for the booking form sidebar */
export function formatBookingSlotSummary(
  dayLabel: string,
  startIso: string,
  endIso: string,
): string {
  const fmt = (d: Date) =>
    d
      .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      .toLowerCase()
      .replace(/\s/g, "")
      .replace(":00", "");
  return `${dayLabel}, ${fmt(new Date(startIso))} – ${fmt(new Date(endIso))}`;
}

/** In-app Cal Video room page (no external video service in v1). */
export function getCalVideoPath(bookingId: string): string {
  return `/booking/video?id=${encodeURIComponent(bookingId)}`;
}
