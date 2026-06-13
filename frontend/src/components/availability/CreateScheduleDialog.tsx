"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateScheduleDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--cal-border)] bg-[#141414] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">New schedule</h2>
            <p className="mt-1 text-sm text-[var(--cal-muted)]">
              Give your availability schedule a name.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--cal-muted)] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="schedule-name" className="mb-1.5 block text-sm text-[var(--cal-muted)]">
              Schedule name
            </label>
            <input
              id="schedule-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Working hours"
              className="w-full rounded-lg border border-[var(--cal-border)] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#6b7280] focus:border-[#4a4a4a]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm text-[var(--cal-muted)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
