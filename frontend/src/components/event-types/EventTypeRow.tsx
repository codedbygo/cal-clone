"use client";

import { useState } from "react";
import {
  Clock,
  Copy,
  ExternalLink,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EventType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  event: EventType;
  bookingPath: string;
  onToggle: (id: string, hidden: boolean) => Promise<void>;
  onEdit: (event: EventType) => void;
  onDelete: (id: string) => Promise<void>;
}

export function EventTypeRow({
  event,
  bookingPath,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${bookingPath}`;

  function handleToggle() {
    void onToggle(event.id, !event.hidden);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    setMenuOpen(false);
    await onDelete(event.id);
  }

  return (
    <div className="group flex items-center gap-3 border-b border-[var(--cal-border)] px-4 py-4 hover:bg-[var(--cal-hover)]">
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--cal-subtle)] opacity-40" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-white">{event.title}</span>
          <span className="text-sm text-[var(--cal-subtle)]">{bookingPath}</span>
          {event.hidden && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-400">
              Hidden
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-[var(--cal-muted)]">
          <Clock className="h-3.5 w-3.5" />
          <span>{event.durationMinutes}m</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={!event.hidden}
          onClick={handleToggle}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            event.hidden ? "bg-[#3f3f3f]" : "bg-white",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-[#101010] transition-transform",
              event.hidden ? "left-0.5" : "left-[22px]",
            )}
          />
        </button>

        <a
          href={event.hidden ? `${bookingPath}?preview=1` : bookingPath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-2 text-[var(--cal-muted)] hover:bg-[var(--cal-active)] hover:text-white"
          title="Preview"
        >
          <ExternalLink className="h-4 w-4" />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md p-2 text-[var(--cal-muted)] hover:bg-[var(--cal-active)] hover:text-white"
          title={copied ? "Copied!" : "Copy link"}
        >
          <Copy className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-md p-2 text-[var(--cal-muted)] hover:bg-[var(--cal-active)] hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-[var(--cal-border)] bg-[#1a1a1a] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(event);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[var(--cal-hover)]"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[var(--cal-hover)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
