"use client";

import { Plus, Trash2 } from "lucide-react";
import type { AvailabilityOverride } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  overrides: AvailabilityOverride[];
  onChange: (overrides: AvailabilityOverride[]) => void;
}

function emptyOverride(): AvailabilityOverride {
  return { date: "", type: "UNAVAILABLE" };
}

export function DateOverridesEditor({ overrides, onChange }: Props) {
  function update(index: number, patch: Partial<AvailabilityOverride>) {
    onChange(
      overrides.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Date overrides</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Block specific dates or set custom hours for one-off days.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...overrides, emptyOverride()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {overrides.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No date overrides.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {overrides.map((o, i) => (
            <div
              key={`${o.date}-${i}`}
              className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-background p-3"
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={o.date}
                  onChange={(e) => update(i, { date: e.target.value })}
                  className="w-40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select
                  value={o.type}
                  onValueChange={(v) =>
                    update(i, {
                      type: v as AvailabilityOverride["type"],
                      ...(v === "UNAVAILABLE"
                        ? { startTime: undefined, endTime: undefined }
                        : { startTime: "09:00", endTime: "17:00" }),
                    })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                    <SelectItem value="CUSTOM_HOURS">Custom hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {o.type === "CUSTOM_HOURS" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">From</Label>
                    <Input
                      type="time"
                      value={o.startTime ?? "09:00"}
                      onChange={(e) => update(i, { startTime: e.target.value })}
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">To</Label>
                    <Input
                      type="time"
                      value={o.endTime ?? "17:00"}
                      onChange={(e) => update(i, { endTime: e.target.value })}
                      className="w-32"
                    />
                  </div>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => onChange(overrides.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
