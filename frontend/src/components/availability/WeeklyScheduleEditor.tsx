"use client";

import { Loader2 } from "lucide-react";
import type { AvailabilityRule } from "@/lib/types";
import { cn, formatTime12h } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/** Mon → Sun (Cal.com order); values match JS Date.getDay(). */
export const WEEKDAYS: { dayOfWeek: number; label: string }[] = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
];

export const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

export interface DayDraft {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export function rulesToDraft(rules: AvailabilityRule[]): DayDraft[] {
  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]));
  return WEEKDAYS.map(({ dayOfWeek, label }) => {
    const rule = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      label,
      enabled: Boolean(rule),
      startTime: rule?.startTime ?? "09:00",
      endTime: rule?.endTime ?? "17:00",
    };
  });
}

export function draftToRules(days: DayDraft[]): AvailabilityRule[] {
  return days
    .filter((d) => d.enabled)
    .map(({ dayOfWeek, startTime, endTime }) => ({
      dayOfWeek,
      startTime,
      endTime,
    }));
}

const TIME_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      opts.push({ value, label: formatTime12h(value) });
    }
  }
  return opts;
})();

function snapToQuarter(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const snapped = Math.round(m / 15) * 15;
  const minute = snapped === 60 ? 0 : snapped;
  const hour = snapped === 60 ? (h + 1) % 24 : h;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function TimeSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const snapped = snapToQuarter(value);
  const options =
    TIME_OPTIONS.some((o) => o.value === snapped)
      ? TIME_OPTIONS
      : [{ value: snapped, label: formatTime12h(snapped) }, ...TIME_OPTIONS];

  return (
    <Select value={snapped} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger className="w-[7.5rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Props {
  timezone: string;
  days: DayDraft[];
  saving: boolean;
  onTimezoneChange: (tz: string) => void;
  onDayChange: (dayOfWeek: number, patch: Partial<DayDraft>) => void;
}

export function WeeklyScheduleEditor({
  timezone,
  days,
  saving,
  onTimezoneChange,
  onDayChange,
}: Props) {
  const tzOptions =
    TIMEZONE_OPTIONS.includes(timezone as (typeof TIMEZONE_OPTIONS)[number])
      ? TIMEZONE_OPTIONS
      : [timezone, ...TIMEZONE_OPTIONS];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {days.map((day, i) => (
          <div
            key={day.dayOfWeek}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5",
              i > 0 && "border-t border-border",
              !day.enabled && "opacity-60",
            )}
          >
            <Switch
              checked={day.enabled}
              onCheckedChange={(enabled) => onDayChange(day.dayOfWeek, { enabled })}
              aria-label={`Toggle ${day.label}`}
            />
            <span
              className={cn(
                "w-28 shrink-0 text-sm",
                day.enabled ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {day.label}
            </span>
            {day.enabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <TimeSelect
                  value={day.startTime}
                  onChange={(startTime) => onDayChange(day.dayOfWeek, { startTime })}
                />
                <span className="text-muted-foreground">–</span>
                <TimeSelect
                  value={day.endTime}
                  onChange={(endTime) => onDayChange(day.dayOfWeek, { endTime })}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <div className="lg:pt-1">
        <Label htmlFor="schedule-timezone" className="mb-2 block">
          Timezone
        </Label>
        <Select value={timezone} disabled={saving} onValueChange={onTimezoneChange}>
          <SelectTrigger id="schedule-timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tzOptions.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          One time range per day. When this schedule is default, public booking pages
          use these hours in this timezone.
        </p>
        {saving && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </p>
        )}
      </div>
    </div>
  );
}
