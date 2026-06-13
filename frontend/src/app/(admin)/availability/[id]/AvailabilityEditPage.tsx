"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  deleteAvailabilitySchedule,
  getAvailabilitySchedule,
  setDefaultAvailabilitySchedule,
  updateAvailabilitySchedule,
} from "@/lib/api";
import {
  draftToRules,
  rulesToDraft,
  WeeklyScheduleEditor,
  type DayDraft,
} from "@/components/availability/WeeklyScheduleEditor";
import { cn, formatScheduleSummary } from "@/lib/utils";

interface Props {
  scheduleId: string;
}

export function AvailabilityEditPage({ scheduleId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [days, setDays] = useState<DayDraft[]>(() => rulesToDraft([]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getAvailabilitySchedule(scheduleId);
      setName(data.name);
      setSummary(data.summary);
      setIsDefault(data.isDefault);
      setTimezone(data.timezone);
      setDays(rulesToDraft(data.rules));
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Schedule not found");
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    load();
  }, [load]);

  const liveSummary = useMemo(() => {
    return formatScheduleSummary(draftToRules(days));
  }, [days]);

  function markDirty() {
    setDirty(true);
    setToast(null);
  }

  function handleDayChange(dayOfWeek: number, patch: Partial<DayDraft>) {
    markDirty();
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const rules = draftToRules(days);
      for (const r of rules) {
        if (r.startTime >= r.endTime) {
          throw new Error("Start time must be before end time on each enabled day");
        }
      }
      const data = await updateAvailabilitySchedule(scheduleId, {
        name: name.trim(),
        timezone,
        rules,
      });
      setName(data.name);
      setSummary(data.summary);
      setIsDefault(data.isDefault);
      setTimezone(data.timezone);
      setDays(rulesToDraft(data.rules));
      setDirty(false);
      setToast(`${data.name} schedule saved`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault() {
    if (isDefault) return;
    setSaving(true);
    try {
      const data = await setDefaultAvailabilitySchedule(scheduleId);
      setIsDefault(data.isDefault);
      setToast("Set as default schedule");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update default");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this availability schedule?")) return;
    try {
      await deleteAvailabilitySchedule(scheduleId);
      router.push("/availability");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--cal-muted)]" />
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8">
        <p className="text-red-400">{error}</p>
        <Link href="/availability" className="mt-4 text-sm text-[var(--cal-muted)] hover:text-white">
          ← Back to availability
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[var(--cal-border)] px-8 py-4">
        <Link
          href="/availability"
          className="inline-flex items-center gap-1 text-sm text-[var(--cal-muted)] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Availability
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex max-w-md items-center gap-2">
              <input
                value={name}
                onChange={(e) => {
                  markDirty();
                  setName(e.target.value);
                }}
                className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-white outline-none placeholder:text-[var(--cal-muted)]"
                placeholder="Schedule name"
              />
              <Pencil className="h-4 w-4 shrink-0 text-[var(--cal-muted)]" aria-hidden />
            </div>
            <p className="mt-1 text-sm text-[var(--cal-muted)]">
              {dirty ? liveSummary : summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={isDefault}
                disabled={isDefault || saving}
                onClick={() => void handleSetDefault()}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                  isDefault ? "bg-white" : "bg-[#3a3a3a]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full transition-transform",
                    isDefault ? "left-[22px] bg-[#101010]" : "left-0.5 bg-[#6b7280]",
                  )}
                />
              </button>
              <span className="text-sm text-[var(--cal-muted)]">Set as default</span>
            </div>
            <div className="h-6 w-px bg-[var(--cal-border)]" />
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-md p-2 text-[var(--cal-muted)] hover:bg-[#1a1a1a] hover:text-red-400"
              aria-label="Delete schedule"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
              className={cn(
                "inline-flex min-w-[5rem] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                dirty
                  ? "bg-white text-black hover:bg-gray-200"
                  : "cursor-default bg-[#2a2a2a] text-[var(--cal-muted)]",
              )}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-8 py-8">
        {error && (
          <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <WeeklyScheduleEditor
          timezone={timezone}
          days={days}
          saving={saving}
          onTimezoneChange={(tz) => {
            markDirty();
            setTimezone(tz);
          }}
          onDayChange={handleDayChange}
        />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[var(--cal-border)] bg-[#1a1a1a] px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
