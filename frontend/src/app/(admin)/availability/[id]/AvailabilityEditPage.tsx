"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { DateOverridesEditor } from "@/components/availability/DateOverridesEditor";
import { Button } from "@/components/ui/button";
import type { AvailabilityOverride } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatScheduleSummary } from "@/lib/utils";

interface Props {
  scheduleId: string;
}

export function AvailabilityEditPage({ scheduleId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [days, setDays] = useState<DayDraft[]>(() => rulesToDraft([]));
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ["availability", scheduleId],
    queryFn: () => getAvailabilitySchedule(scheduleId),
  });

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setSummary(data.summary);
    setIsDefault(data.isDefault);
    setTimezone(data.timezone);
    setDays(rulesToDraft(data.rules));
    setOverrides(data.overrides ?? []);
    setDirty(false);
  }, [data]);

  const liveSummary = useMemo(() => formatScheduleSummary(draftToRules(days)), [days]);

  const markDirty = useCallback(() => {
    setDirty(true);
    setToast(null);
  }, []);

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
      const updated = await updateAvailabilitySchedule(scheduleId, {
        name: name.trim(),
        timezone,
        rules,
        overrides: overrides.filter((o) => o.date),
      });
      queryClient.setQueryData(["availability", scheduleId], updated);
      setName(updated.name);
      setSummary(updated.summary);
      setIsDefault(updated.isDefault);
      setTimezone(updated.timezone);
      setDays(rulesToDraft(updated.rules));
      setOverrides(updated.overrides ?? []);
      setDirty(false);
      setToast(`${updated.name} schedule saved`);
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
      const updated = await setDefaultAvailabilitySchedule(scheduleId);
      setIsDefault(updated.isDefault);
      setToast("Set as default schedule");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update default");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteAvailabilitySchedule(scheduleId);
      router.push("/availability");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-24">
        <p className="text-destructive">
          {loadError instanceof Error ? loadError.message : "Schedule not found"}
        </p>
        <Link
          href="/availability"
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to availability
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col pb-12">
      <div className="border-b border-border bg-card px-6 py-4 lg:px-8">
        <Link
          href="/availability"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Availability
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex max-w-md items-center gap-2">
              <Input
                value={name}
                onChange={(e) => {
                  markDirty();
                  setName(e.target.value);
                }}
                className="border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                placeholder="Schedule name"
              />
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {dirty ? liveSummary : summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isDefault}
                disabled={isDefault || saving}
                onCheckedChange={() => void handleSetDefault()}
                aria-label="Set as default schedule"
              />
              <span className="text-sm text-muted-foreground">Set as default</span>
            </div>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete schedule"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
              variant={dirty ? "default" : "secondary"}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 lg:px-8">
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

        <div className="mt-8">
          <DateOverridesEditor
            overrides={overrides}
            onChange={(next) => {
              markDirty();
              setOverrides(next);
            }}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
          {toast}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete schedule?"
        description="This availability schedule and its weekly rules will be permanently removed."
        confirmLabel="Delete"
        loading={deleting}
        destructive
        onConfirm={handleDeleteConfirm}
        onClose={() => !deleting && setDeleteOpen(false)}
      />
    </div>
  );
}
