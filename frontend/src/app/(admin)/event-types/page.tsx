"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { EventTypeForm } from "@/components/event-types/EventTypeForm";
import { EventTypeRow } from "@/components/event-types/EventTypeRow";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEventType,
  deleteEventType,
  getEventTypes,
  toggleEventTypeHidden,
  updateEventType,
} from "@/lib/api";
import type { EventType, EventTypeInput } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);

  const load = useCallback(async (fresh = false) => {
    setError(null);
    try {
      const data = await getEventTypes(fresh ? { fresh: true } : undefined);
      setEventTypes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eventTypes;
    return eventTypes.filter(
      (et) =>
        et.title.toLowerCase().includes(q) ||
        et.slug.toLowerCase().includes(q) ||
        et.description.toLowerCase().includes(q),
    );
  }, [eventTypes, search]);

  async function handleCreate(data: EventTypeInput) {
    await createEventType(data);
    await load(true);
  }

  async function handleUpdate(data: EventTypeInput) {
    if (!editing) return;
    await updateEventType(editing.id, data);
    await load(true);
  }

  async function handleToggle(id: string, hidden: boolean) {
    const snapshot = eventTypes;
    setEventTypes((prev) =>
      prev.map((et) => (et.id === id ? { ...et, hidden } : et)),
    );
    try {
      const updated = await toggleEventTypeHidden(id, hidden);
      setEventTypes((prev) =>
        prev.map((et) => (et.id === id ? updated : et)),
      );
    } catch (e) {
      setEventTypes(snapshot);
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    await deleteEventType(id);
    setEventTypes((prev) => prev.filter((et) => et.id !== id));
  }

  return (
    <AdminPageShell
      title="Event types"
      description="Configure different events for people to book on your calendar."
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-9 sm:w-56"
            />
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </>
      }
    >
      {loading && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse px-4 py-4",
                i < 2 && "border-b border-border",
              )}
            >
              <div className="h-4 w-56 rounded bg-muted" />
              <div className="mt-2 h-3 w-12 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "No event types match your search." : "No event types yet."}
          </p>
          {!search && (
            <Button
              className="mt-4"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create your first event type
            </Button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {filtered.map((et, index) => (
            <EventTypeRow
              key={et.id}
              event={et}
              bookingPath={`/book/${et.slug}`}
              isLast={index === filtered.length - 1}
              onToggle={handleToggle}
              onEdit={(e) => {
                setEditing(e);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EventTypeForm
        open={formOpen}
        event={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </AdminPageShell>
  );
}
