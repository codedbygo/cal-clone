"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  createAvailabilitySchedule,
  getAvailabilitySchedules,
} from "@/lib/api";
import { CreateScheduleDialog } from "@/components/availability/CreateScheduleDialog";
import { ScheduleListRow } from "@/components/availability/ScheduleListRow";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { Button } from "@/components/ui/button";

export default function AvailabilityPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: schedules = [], isLoading, isError, error } = useQuery({
    queryKey: ["availability-schedules"],
    queryFn: getAvailabilitySchedules,
  });

  async function handleCreate(name: string) {
    const created = await createAvailabilitySchedule({ name });
    router.push(`/availability/${created.id}`);
  }

  return (
    <AdminPageShell
      title="Availability"
      description="Configure times when you are available for bookings."
      actions={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      }
    >
      {isLoading && (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-card" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load availability"}
        </p>
      )}

      {!isLoading && !isError && schedules.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No availability schedules yet.</p>
          <Button variant="link" className="mt-4" onClick={() => setDialogOpen(true)}>
            Create your first schedule
          </Button>
        </div>
      )}

      {!isLoading && schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map((s) => (
            <ScheduleListRow key={s.id} schedule={s} />
          ))}
        </div>
      )}

      <CreateScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </AdminPageShell>
  );
}
