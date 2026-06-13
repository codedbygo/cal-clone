"use client";

import { Plug, Unplug } from "lucide-react";
import type { IntegrationSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  integration: IntegrationSummary;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function AppIntegrationCard({
  integration,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: Props) {
  const connected = integration.status === "CONNECTED";
  const needsReconnect = integration.status === "ERROR";

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          <Plug className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{integration.name}</h3>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {integration.category}
            </span>
            {needsReconnect && (
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">
                Reconnect required
              </span>
            )}
            {connected && (
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-500">
                Connected
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{integration.description}</p>
          {connected && integration.accountEmail && (
            <p className="mt-2 text-xs text-muted-foreground">{integration.accountEmail}</p>
          )}
          {needsReconnect && (
            <p className="mt-2 text-xs text-amber-500">
              Permissions changed or expired. Disconnect and connect again to grant Calendar/Meeting access.
            </p>
          )}
          {!integration.configured && (
            <p className="mt-2 text-xs text-amber-500">
              OAuth not configured — add credentials to backend/.env
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        {connected ? (
          <Button
            variant="outline"
            className="w-full gap-2 sm:w-auto"
            disabled={disconnecting}
            onClick={onDisconnect}
          >
            <Unplug className="h-4 w-4" />
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : (
          <Button
            className={cn("w-full gap-2 sm:w-auto")}
            disabled={connecting || !integration.configured}
            onClick={onConnect}
          >
            <Plug className="h-4 w-4" />
            {connecting ? "Redirecting…" : needsReconnect ? "Reconnect" : "Connect"}
          </Button>
        )}
      </div>
    </div>
  );
}
