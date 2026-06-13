"use client";

import { Loader2 } from "lucide-react";
import type { AvailabilityRule } from "@/lib/types";
import { cn, formatTime12h } from "@/lib/utils";

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

function DayToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        enabled ? "bg-white" : "bg-[#3a3a3a]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full transition-transform",
          enabled ? "left-[22px] bg-[#101010]" : "left-0.5 bg-[#6b7280]",
        )}
      />
    </button>
  );
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
    <select
      value={snapped}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "min-w-[6.5rem] rounded-md border border-[var(--cal-border)] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none",
        "focus:border-[#5a5a5a] disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
      {/* One window per day — no + / copy (out of assignment scope) */}
      <div className="overflow-hidden rounded-xl border border-[var(--cal-border)]">
        {days.map((day, i) => (
          <div
            key={day.dayOfWeek}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5",
              i > 0 && "border-t border-[var(--cal-border)]",
              !day.enabled && "opacity-45",
            )}
          >
            <DayToggle
              enabled={day.enabled}
              onChange={(enabled) => onDayChange(day.dayOfWeek, { enabled })}
            />
            <span
              className={cn(
                "w-28 shrink-0 text-sm",
                day.enabled ? "font-medium text-white" : "text-[var(--cal-muted)]",
              )}
            >
              {day.label}
            </span>
            {day.enabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <TimeSelect
                  value={day.startTime}
                  onChange={(startTime) =>
                    onDayChange(day.dayOfWeek, { startTime })
                  }
                />
                <span className="text-[var(--cal-muted)]">–</span>
                <TimeSelect
                  value={day.endTime}
                  onChange={(endTime) => onDayChange(day.dayOfWeek, { endTime })}
                />
              </div>
            ) : (
              <span className="text-sm text-[var(--cal-muted)]">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <div className="lg:pt-1">
        <label
          htmlFor="schedule-timezone"
          className="mb-2 block text-sm font-medium text-white"
        >
          Timezone
        </label>
        <select
          id="schedule-timezone"
          value={timezone}
          disabled={saving}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--cal-border)] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-[#4a4a4a] disabled:opacity-50"
        >
          {tzOptions.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-relaxed text-[var(--cal-muted)]">
          One time range per day. When this schedule is default, public booking
          pages use these hours in this timezone.
        </p>
        {saving && (
          <p className="mt-4 flex items-center gap-2 text-sm text-[var(--cal-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </p>
        )}
      </div>
    </div>
  );
}
