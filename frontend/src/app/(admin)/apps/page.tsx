"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  disconnectIntegration,
  getIntegrationAuthUrl,
  getIntegrations,
} from "@/lib/api";
import type { IntegrationProvider, IntegrationSummary } from "@/lib/types";
import { AppIntegrationCard } from "@/components/apps/AppIntegrationCard";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { cn } from "@/lib/utils";

type Filter = "All" | "Calendar" | "Video";

const FILTERS: Filter[] = ["All", "Calendar", "Video"];

function AppsContent() {
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<IntegrationProvider | null>(null);
  const [disconnecting, setDisconnecting] = useState<IntegrationProvider | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setIntegrations(await getIntegrations());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "google") {
      setBanner({ type: "success", message: "Google Calendar & Meet connected successfully." });
      void load();
    } else if (connected === "zoom") {
      setBanner({ type: "success", message: "Zoom Video connected successfully." });
      void load();
    } else if (err) {
      setBanner({
        type: "error",
        message:
          err === "oauth_failed"
            ? "Connection failed. Check OAuth credentials and try again."
            : `Connection error: ${err}`,
      });
    }
  }, [searchParams, load]);

  const filtered = useMemo(() => {
    if (filter === "All") return integrations;
    return integrations.filter((i) => i.category === filter);
  }, [integrations, filter]);

  async function handleConnect(provider: IntegrationProvider) {
    setConnecting(provider);
    try {
      const key = provider.toLowerCase() as "google" | "zoom";
      const { url } = await getIntegrationAuthUrl(key);
      window.location.href = url;
    } catch (e) {
      setBanner({
        type: "error",
        message: e instanceof Error ? e.message : "Could not start OAuth",
      });
      setConnecting(null);
    }
  }

  async function handleDisconnect(provider: IntegrationProvider) {
    setDisconnecting(provider);
    try {
      const key = provider.toLowerCase() as "google" | "zoom";
      await disconnectIntegration(key);
      await load();
      setBanner({ type: "success", message: "Integration disconnected." });
    } catch (e) {
      setBanner({
        type: "error",
        message: e instanceof Error ? e.message : "Disconnect failed",
      });
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <AdminPageShell
      title="Apps"
      description="Connect your calendar and conferencing accounts"
      headerExtra={
        <div className="mt-4 inline-flex rounded-lg border border-border bg-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors",
                filter === f
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      {banner && (
        <div
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            banner.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {banner.message}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
              <div className="h-11 w-11 rounded-lg bg-muted" />
              <div className="mt-4 h-5 w-48 rounded bg-muted" />
              <div className="mt-2 h-4 w-full rounded bg-muted/60" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 py-12 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((integration) => (
            <AppIntegrationCard
              key={integration.provider}
              integration={integration}
              connecting={connecting === integration.provider}
              disconnecting={disconnecting === integration.provider}
              onConnect={() => void handleConnect(integration.provider)}
              onDisconnect={() => void handleDisconnect(integration.provider)}
            />
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

export default function AppsPage() {
  return (
    <Suspense fallback={null}>
      <AppsContent />
    </Suspense>
  );
}
