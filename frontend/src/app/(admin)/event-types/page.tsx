"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { EventTypeForm } from "@/components/event-types/EventTypeForm";
import { EventTypeRow } from "@/components/event-types/EventTypeRow";
import {
  createEventType,
  deleteEventType,
  getEventTypes,
  toggleEventTypeHidden,
  updateEventType,
} from "@/lib/api";
import type { EventType, EventTypeInput } from "@/lib/types";

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--cal-border)] px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Event types</h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--cal-muted)]">
              Configure different events for people to book on your calendar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cal-subtle)]" />
              <input
                type="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-md border border-[var(--cal-border)] bg-[#101010] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[var(--cal-subtle)] focus:border-gray-500 sm:w-56"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 py-2">
        {loading && (
          <div className="overflow-hidden rounded-lg border border-[var(--cal-border)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 border-b border-[var(--cal-border)] px-4 py-4 last:border-b-0"
              >
                <div className="h-4 w-4 rounded bg-[#2a2a2a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-[#2a2a2a]" />
                  <div className="h-3 w-16 rounded bg-[#2a2a2a]" />
                </div>
                <div className="h-6 w-11 rounded-full bg-[#2a2a2a]" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="py-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <p className="mt-1 text-sm text-[var(--cal-muted)]">
              Is the backend running on port 4000?
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--cal-muted)]">
              {search ? "No event types match your search." : "No event types yet."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Create your first event type
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-[var(--cal-border)]">
            {filtered.map((et) => (
              <EventTypeRow
                key={et.id}
                event={et}
                bookingPath={`/book/${et.slug}`}
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
      </div>

      <EventTypeForm
        open={formOpen}
        event={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}
