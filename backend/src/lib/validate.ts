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
