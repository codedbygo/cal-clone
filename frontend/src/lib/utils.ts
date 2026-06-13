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
