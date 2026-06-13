"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getInsightsCallHistory } from "@/lib/api";
import type { InsightsCallHistoryData } from "@/lib/types";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { KpiStat } from "@/components/insights/InsightsChartCard";
import { InsightsSubNav } from "@/components/insights/InsightsSubNav";
import { meetingJoinLabel, resolveMeetingUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function InsightsCallHistoryPage() {
  const [data, setData] = useState<InsightsCallHistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInsightsCallHistory()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <AdminPageShell
      title="Insights"
      description="Past meetings and video links from completed bookings."
    >
      <InsightsSubNav />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <>
          <KpiStat title="Past meetings" value={data.total} hint={`Last ${data.days} days`} />

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {data.calls.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No past meetings yet.</p>
            ) : (
              <ul>
                {data.calls.map((call, i) => {
                  const joinUrl = resolveMeetingUrl(call.id, call.meetingUrl);
                  const external = joinUrl.startsWith("http");
                  return (
                    <li
                      key={call.id}
                      className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        i < data.calls.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground">{call.eventTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {call.attendeeName} ·{" "}
                          {new Date(call.startTime).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={joinUrl}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="gap-1.5"
                        >
                          {meetingJoinLabel(call.meetingProvider)}
                          {external && <ExternalLink className="h-3.5 w-3.5" />}
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
