"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { EventType, EventTypeInput } from "@/lib/types";
import { slugify } from "@/lib/utils";

interface Props {
  open: boolean;
  event?: EventType | null;
  onClose: () => void;
  onSubmit: (data: EventTypeInput) => Promise<void>;
}

export function EventTypeForm({ open, event, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(event);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setDurationMinutes(event.durationMinutes);
      setSlug(event.slug);
      setSlugTouched(true);
    } else {
      setTitle("");
      setDescription("");
      setDurationMinutes(30);
      setSlug("");
      setSlugTouched(false);
    }
    setError(null);
  }, [open, event]);

  useEffect(() => {
    if (!slugTouched && title) setSlug(slugify(title));
  }, [title, slugTouched]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes),
        slug: slug.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--cal-border)] bg-[#1a1a1a] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--cal-border)] px-5 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit event type" : "Add a new event type"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-[var(--cal-muted)]">
              Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[var(--cal-border)] bg-[#101010] px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
              placeholder="30 min meeting"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--cal-muted)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-[var(--cal-border)] bg-[#101010] px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
              placeholder="A quick video meeting"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--cal-muted)]">
                Duration (minutes)
              </label>
              <input
                required
                type="number"
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-[var(--cal-border)] bg-[#101010] px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--cal-muted)]">
                URL slug
              </label>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="w-full rounded-md border border-[var(--cal-border)] bg-[#101010] px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
                placeholder="30-min"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[var(--cal-muted)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
