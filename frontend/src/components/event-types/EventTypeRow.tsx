"use client";

import { useState } from "react";
import {
  Clock,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EventType } from "@/lib/types";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface Props {
  event: EventType;
  bookingPath: string;
  isLast?: boolean;
  onToggle: (id: string, hidden: boolean) => Promise<void>;
  onEdit: (event: EventType) => void;
  onDelete: (id: string) => Promise<void>;
}

export function EventTypeRow({
  event,
  bookingPath,
  isLast = false,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${bookingPath}`;

  async function handleCopy() {
    const ok = await copyToClipboard(fullUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await onDelete(event.id);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent",
        !isLast && "border-b border-border",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-medium text-foreground">{event.title}</span>
          <span className="truncate text-sm text-muted-foreground">{bookingPath}</span>
          {event.hidden && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-500">
              Hidden
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{event.durationMinutes}m</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Switch
          checked={!event.hidden}
          onCheckedChange={(checked) => void onToggle(event.id, !checked)}
          aria-label={event.hidden ? "Show event type" : "Hide event type"}
        />

        <a
          href={event.hidden ? `${bookingPath}?preview=1` : bookingPath}
          target="_blank"
          rel="noopener noreferrer"
          title="Preview"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
        </a>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => void handleCopy()}
          title={copied ? "Copied!" : "Copy link"}
          className="text-muted-foreground"
        >
          <Copy className={cn("h-4 w-4", copied && "text-emerald-500")} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More options" className="text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" collisionPadding={16}>
            <DropdownMenuItem onClick={() => onEdit(event)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <ConfirmDialog
      open={deleteOpen}
      title={`Delete "${event.title}"?`}
      description="This event type and its bookings will be permanently removed. This cannot be undone."
      confirmLabel="Delete"
      loading={deleting}
      destructive
      onConfirm={handleDeleteConfirm}
      onClose={() => !deleting && setDeleteOpen(false)}
    />
    </>
  );
}
