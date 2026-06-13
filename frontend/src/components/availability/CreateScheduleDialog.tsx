"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateScheduleDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a schedule name");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreate(trimmed);
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent title="New schedule">
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Give your availability schedule a name.
          </p>
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Schedule name</Label>
            <Input
              id="schedule-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Working hours"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
