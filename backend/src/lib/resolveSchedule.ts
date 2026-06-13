import type { AvailabilityRule, AvailabilitySchedule } from "@prisma/client";

type ScheduleWithRules = AvailabilitySchedule & {
  rules: AvailabilityRule[];
};

export function resolveBookingSchedule(
  schedules: ScheduleWithRules[],
): ScheduleWithRules | null {
  if (schedules.length === 0) return null;
  return schedules.find((s) => s.isDefault) ?? schedules[0]!;
}
