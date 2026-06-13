"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  createAvailabilitySchedule,
  getAvailabilitySchedules,
} from "@/lib/api";
import { CreateScheduleDialog } from "@/components/availability/CreateScheduleDialog";
import { ScheduleListRow } from "@/components/availability/ScheduleListRow";
import type { AvailabilitySchedule } from "@/lib/types";

export default function AvailabilityPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getAvailabilitySchedules();
      setSchedules(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(name: string) {
    const created = await createAvailabilitySchedule({ name });
    router.push(`/availability/${created.id}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-[var(--cal-border)] px-8 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Availability</h1>
          <p className="mt-1 text-sm text-[var(--cal-muted)]">
            Configure times when you are available for bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </header>

      <div className="flex-1 px-8 py-6">
        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-[#2a2a2a]" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && schedules.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--cal-border)] py-16 text-center">
            <p className="text-sm text-[var(--cal-muted)]">
              No availability schedules yet.
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-4 text-sm text-white underline underline-offset-4 hover:text-[var(--cal-muted)]"
            >
              Create your first schedule
            </button>
          </div>
        )}

        {!loading && schedules.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-[var(--cal-border)]">
            {schedules.map((s) => (
              <ScheduleListRow key={s.id} schedule={s} />
            ))}
          </div>
        )}
      </div>

      <CreateScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
