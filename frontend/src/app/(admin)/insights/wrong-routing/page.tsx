"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getInsightsWrongRouting } from "@/lib/api";
import type { InsightsWrongRoutingData } from "@/lib/types";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { CHART_COLORS, InsightsChartCard, KpiStat } from "@/components/insights/InsightsChartCard";
import { InsightsSubNav } from "@/components/insights/InsightsSubNav";

export default function InsightsWrongRoutingPage() {
  const [data, setData] = useState<InsightsWrongRoutingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInsightsWrongRouting()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <AdminPageShell
      title="Insights"
      description="Cancelled bookings and drop-off rates by event type."
    >
      <InsightsSubNav />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <>
          <KpiStat title="Total cancelled" value={data.totalCancelled} hint={`Last ${data.days} days`} />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <InsightsChartCard title="Cancellation rate by event">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cancellationRateByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="eventTitle" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="rate" fill={CHART_COLORS.rose} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightsChartCard>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground">Recent cancellations</h3>
              <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto text-sm">
                {data.cancelledBookings.map((b) => (
                  <li key={b.id} className="border-b border-border pb-2">
                    <p className="font-medium text-foreground">{b.attendeeName}</p>
                    <p className="text-muted-foreground">
                      {b.eventTitle} · {new Date(b.startTime).toLocaleString()}
                    </p>
                  </li>
                ))}
                {data.cancelledBookings.length === 0 && (
                  <li className="text-muted-foreground">No cancellations in this period.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
