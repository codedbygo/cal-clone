"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { CustomQuestion, EventType, EventTypeInput } from "@/lib/types";
import { slugify, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  open: boolean;
  event?: EventType | null;
  onClose: () => void;
  onSubmit: (data: EventTypeInput) => Promise<void>;
}

function newQuestion(): CustomQuestion {
  return {
    id: `q${Date.now()}`,
    label: "",
    type: "text",
    required: false,
  };
}

export function EventTypeForm({ open, event, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [slug, setSlug] = useState("");
  const [bufferBeforeMinutes, setBufferBeforeMinutes] = useState(0);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(0);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
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
      setBufferBeforeMinutes(event.bufferBeforeMinutes ?? 0);
      setBufferAfterMinutes(event.bufferAfterMinutes ?? 0);
      setCustomQuestions(
        Array.isArray(event.customQuestions) ? event.customQuestions : [],
      );
      setSlugTouched(true);
    } else {
      setTitle("");
      setDescription("");
      setDurationMinutes(30);
      setSlug("");
      setBufferBeforeMinutes(0);
      setBufferAfterMinutes(0);
      setCustomQuestions([]);
      setSlugTouched(false);
    }
    setError(null);
  }, [open, event]);

  useEffect(() => {
    if (!slugTouched && title) setSlug(slugify(title));
  }, [title, slugTouched]);

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
        bufferBeforeMinutes: Number(bufferBeforeMinutes),
        bufferAfterMinutes: Number(bufferAfterMinutes),
        customQuestions: customQuestions
          .filter((q) => q.label.trim())
          .map((q) => ({ ...q, label: q.label.trim() })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        title={isEdit ? "Edit event type" : "Add a new event type"}
        className="max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="30 min meeting"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(
                "flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
              placeholder="A quick video meeting"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-duration">Duration (minutes)</Label>
              <Input
                id="event-duration"
                required
                type="number"
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-slug">URL slug</Label>
              <Input
                id="event-slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="30-min"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Buffer time</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Extra minutes blocked before and after each booking.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buffer-before" className="text-xs">
                  Before (min)
                </Label>
                <Input
                  id="buffer-before"
                  type="number"
                  min={0}
                  max={120}
                  value={bufferBeforeMinutes}
                  onChange={(e) => setBufferBeforeMinutes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buffer-after" className="text-xs">
                  After (min)
                </Label>
                <Input
                  id="buffer-after"
                  type="number"
                  min={0}
                  max={120}
                  value={bufferAfterMinutes}
                  onChange={(e) => setBufferAfterMinutes(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Custom questions</p>
                <p className="text-xs text-muted-foreground">Ask bookers extra info (max 5).</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={customQuestions.length >= 5}
                onClick={() => setCustomQuestions((prev) => [...prev, newQuestion()])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {customQuestions.length > 0 && (
              <div className="mt-3 space-y-3">
                {customQuestions.map((q, i) => (
                  <div key={q.id} className="flex gap-2">
                    <Input
                      value={q.label}
                      onChange={(e) =>
                        setCustomQuestions((prev) =>
                          prev.map((item, idx) =>
                            idx === i ? { ...item, label: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Question label"
                      className="flex-1"
                    />
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Switch
                        checked={q.required}
                        onCheckedChange={(checked) =>
                          setCustomQuestions((prev) =>
                            prev.map((item, idx) =>
                              idx === i ? { ...item, required: checked } : item,
                            ),
                          )
                        }
                      />
                      Req.
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCustomQuestions((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
