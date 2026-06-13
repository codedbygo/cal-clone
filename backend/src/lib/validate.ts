import { ApiError } from "../middleware/errorHandler";

export function invalid(message: string): never {
  throw new ApiError(400, "VALIDATION", message);
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateTitle(title: unknown): string {
  if (typeof title !== "string") invalid("title: must be a string");
  const t = title.trim();
  if (t.length < 1 || t.length > 100) invalid("title: must be 1–100 characters");
  return t;
}

export function validateDescription(description: unknown): string {
  if (description === undefined || description === null) return "";
  if (typeof description !== "string") invalid("description: must be a string");
  if (description.length > 500) invalid("description: max 500 characters");
  return description;
}

export function validateSlug(slug: unknown): string {
  if (typeof slug !== "string") invalid("slug: must be a string");
  const s = slug.trim().toLowerCase();
  if (!SLUG_RE.test(s) || s.length > 60) {
    invalid("slug: lowercase letters, numbers, hyphens only (max 60)");
  }
  return s;
}

export function validateDuration(durationMinutes: unknown): number {
  if (typeof durationMinutes !== "number" || !Number.isInteger(durationMinutes)) {
    invalid("durationMinutes: must be an integer");
  }
  if (durationMinutes < 5 || durationMinutes > 480) {
    invalid("durationMinutes: must be between 5 and 480");
  }
  return durationMinutes;
}

export function validateHidden(hidden: unknown): boolean {
  if (typeof hidden !== "boolean") invalid("hidden: must be a boolean");
  return hidden;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAttendeeName(name: unknown): string {
  if (typeof name !== "string") invalid("attendeeName: must be a string");
  const n = name.trim();
  if (n.length < 1 || n.length > 100) {
    invalid("attendeeName: must be 1–100 characters");
  }
  return n;
}

export function validateAttendeeEmail(email: unknown): string {
  if (typeof email !== "string") invalid("attendeeEmail: must be a string");
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e) || e.length > 254) {
    invalid("attendeeEmail: must be a valid email address");
  }
  return e;
}

export function validateBookingStartTime(startTime: unknown): Date {
  if (typeof startTime !== "string") invalid("startTime: must be an ISO datetime string");
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) invalid("startTime: must be a valid ISO datetime");
  if (d <= new Date()) invalid("startTime: must be in the future");
  return d;
}

export function validateEventTypeId(eventTypeId: unknown): string {
  if (typeof eventTypeId !== "string" || !eventTypeId.trim()) {
    invalid("eventTypeId: required");
  }
  return eventTypeId.trim();
}
