"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { getPublicHostProfile } from "@/lib/api";
import type { PublicHostProfile } from "@/lib/types";

export default function PublicBookIndexPage() {
  const [profile, setProfile] = useState<PublicHostProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicHostProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p className="text-lg font-medium text-foreground">Could not load booking page</p>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  const initials = profile.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {initials}
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{profile.user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Select an event type to book</p>
        </div>

        <div className="mt-8 space-y-3">
          {profile.eventTypes.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
              No events are available for booking right now.
            </p>
          ) : (
            profile.eventTypes.map((event) => (
              <Link
                key={event.id}
                href={`/book/${event.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-foreground/20 hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground group-hover:underline">
                    {event.title}
                  </h2>
                  {event.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{event.durationMinutes}m</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))
          )}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">Cal.com</p>
      </div>
    </div>
  );
}
