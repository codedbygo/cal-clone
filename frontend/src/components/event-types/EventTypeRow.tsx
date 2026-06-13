"use client";

import { useState } from "react";
import {
  Copy,
  ExternalLink,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EventType } from "@/lib/types";
import { getEventAccent } from "@/lib/eventAccent";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [copied, setCopied] = useState(false);
  const accent = getEventAccent(event.slug);

  const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${bookingPath}`;

  function handleToggle() {
    void onToggle(event.id, !event.hidden);
  }

  async function handleCopy() {
    const ok = await copyToClipboard(fullUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    await onDelete(event.id);
  }

  return (
    <div className="group rounded-lg border border-[var(--cal-border)] bg-[var(--cal-card)] px-4 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--cal-subtle)] opacity-60" />

        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", accent)} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[var(--cal-text)]">{event.title}</span>
            <span className="rounded-md bg-[var(--cal-badge)] px-2 py-0.5 text-xs font-medium text-[var(--cal-muted)]">
              {event.durationMinutes}m
            </span>
            {event.hidden && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                Hidden
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--cal-muted)]">{bookingPath}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={!event.hidden}
            aria-label={event.hidden ? "Show event type" : "Hide event type"}
            onClick={handleToggle}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              event.hidden ? "bg-[var(--cal-border)]" : "bg-[var(--cal-primary)]",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--cal-card)] shadow transition-transform",
                event.hidden ? "left-0.5" : "left-[22px]",
              )}
            />
          </button>

          <a
            href={event.hidden ? `${bookingPath}?preview=1` : bookingPath}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-[var(--cal-text)] sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleCopy()}
            title={copied ? "Copied!" : "Copy link"}
          >
            <Copy className={cn("h-4 w-4", copied && "text-emerald-500")} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" collisionPadding={16}>
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void handleDelete()}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
