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

export function validateBufferMinutes(value: unknown, field: string): number {
  if (value === undefined || value === null) return 0;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    invalid(`${field}: must be an integer`);
  }
  if (value < 0 || value > 120) {
    invalid(`${field}: must be between 0 and 120`);
  }
  return value;
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "textarea";
  required: boolean;
}

export function validateCustomQuestions(questions: unknown): CustomQuestion[] {
  if (questions === undefined || questions === null) return [];
  if (!Array.isArray(questions)) invalid("customQuestions: must be an array");
  if (questions.length > 5) invalid("customQuestions: max 5 questions");

  return questions.map((q, i) => {
    if (typeof q !== "object" || q === null) {
      invalid(`customQuestions[${i}]: must be an object`);
    }
    const raw = q as Record<string, unknown>;
    const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `q${i + 1}`;
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    if (label.length < 1 || label.length > 200) {
      invalid(`customQuestions[${i}].label: must be 1–200 characters`);
    }
    const type = raw.type === "textarea" ? "textarea" : "text";
    const required = raw.required === true;
    return { id, label, type, required };
  });
}

export function validateBookingAnswers(
  questions: CustomQuestion[],
  answers: unknown,
): Record<string, string> {
  if (answers === undefined || answers === null) {
    if (questions.some((q) => q.required)) {
      invalid("answers: required for custom questions");
    }
    return {};
  }
  if (typeof answers !== "object" || Array.isArray(answers)) {
    invalid("answers: must be an object");
  }
  const raw = answers as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const q of questions) {
    const val = raw[q.id];
    if (val === undefined || val === null || val === "") {
      if (q.required) invalid(`answers.${q.id}: required`);
      continue;
    }
    if (typeof val !== "string") invalid(`answers.${q.id}: must be a string`);
    const trimmed = val.trim();
    if (trimmed.length > 1000) invalid(`answers.${q.id}: max 1000 characters`);
    result[q.id] = trimmed;
  }

  return result;
}

export interface AvailabilityOverrideInput {
  date: string;
  type: "UNAVAILABLE" | "CUSTOM_HOURS";
  startTime?: string;
  endTime?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateAvailabilityOverrides(
  overrides: unknown,
): AvailabilityOverrideInput[] {
  if (overrides === undefined || overrides === null) return [];
  if (!Array.isArray(overrides)) invalid("overrides: must be an array");

  const seen = new Set<string>();
  const result: AvailabilityOverrideInput[] = [];

  for (const entry of overrides) {
    if (typeof entry !== "object" || entry === null) {
      invalid("overrides: each entry must be an object");
    }
    const raw = entry as Record<string, unknown>;
    const date = typeof raw.date === "string" ? raw.date : "";
    if (!DATE_RE.test(date)) invalid("overrides.date: must be YYYY-MM-DD");
    if (seen.has(date)) invalid("overrides: duplicate date");
    seen.add(date);

    const type =
      raw.type === "CUSTOM_HOURS" ? "CUSTOM_HOURS" : "UNAVAILABLE";

    if (type === "CUSTOM_HOURS") {
      const startTime = validateTimeString(raw.startTime, "startTime");
      const endTime = validateTimeString(raw.endTime, "endTime");
      if (startTime >= endTime) {
        invalid("override startTime must be before endTime");
      }
      result.push({ date, type, startTime, endTime });
    } else {
      result.push({ date, type: "UNAVAILABLE" });
    }
  }

  return result;
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

export function validateBookingFilter(
  filter: unknown,
): "upcoming" | "past" | "cancelled" {
  if (filter === undefined || filter === null || filter === "upcoming") {
    return "upcoming";
  }
  if (filter === "past") return "past";
  if (filter === "cancelled") return "cancelled";
  invalid('filter: must be "upcoming", "past", or "cancelled"');
}

export function validateBookingStatus(status: unknown): "CANCELLED" {
  if (status !== "CANCELLED") {
    invalid('status: must be "CANCELLED"');
  }
  return "CANCELLED";
}

export function validateScheduleName(name: unknown): string {
  if (typeof name !== "string") invalid("name: must be a string");
  const n = name.trim();
  if (n.length < 1 || n.length > 80) invalid("name: must be 1–80 characters");
  return n;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateTimeString(value: unknown, field: string): string {
  if (typeof value !== "string" || !TIME_RE.test(value)) {
    invalid(`${field}: must be HH:mm (24-hour)`);
  }
  return value;
}

export function validateTimezone(timezone: unknown): string {
  if (typeof timezone !== "string" || !timezone.trim()) {
    invalid("timezone: required");
  }
  const tz = timezone.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    invalid("timezone: must be a valid IANA timezone");
  }
}

export interface AvailabilityRuleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function validateAvailabilityRules(rules: unknown): AvailabilityRuleInput[] {
  if (!Array.isArray(rules)) invalid("rules: must be an array");

  const seen = new Set<number>();
  const result: AvailabilityRuleInput[] = [];

  for (const entry of rules) {
    if (typeof entry !== "object" || entry === null) {
      invalid("rules: each entry must be an object");
    }
    const raw = entry as Record<string, unknown>;
    const dayOfWeek = raw.dayOfWeek;
    if (
      typeof dayOfWeek !== "number" ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      invalid("dayOfWeek: must be an integer 0–6 (0 = Sunday)");
    }
    if (seen.has(dayOfWeek)) invalid("rules: duplicate dayOfWeek");
    seen.add(dayOfWeek);

    const startTime = validateTimeString(raw.startTime, "startTime");
    const endTime = validateTimeString(raw.endTime, "endTime");
    if (startTime >= endTime) {
      invalid("startTime must be before endTime for each rule");
    }
    result.push({ dayOfWeek, startTime, endTime });
  }

  return result;
}
