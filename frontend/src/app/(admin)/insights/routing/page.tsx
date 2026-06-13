"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getInsightsRouting } from "@/lib/api";
import type { InsightsRoutingData } from "@/lib/types";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { CHART_COLORS, InsightsChartCard, KpiStat } from "@/components/insights/InsightsChartCard";
import { InsightsSubNav } from "@/components/insights/InsightsSubNav";

export default function InsightsRoutingPage() {
  const [data, setData] = useState<InsightsRoutingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInsightsRouting()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <AdminPageShell
      title="Insights"
      description="How visitors reach your booking pages — all direct in single-host mode."
    >
      <InsightsSubNav />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiStat title="Total bookings" value={data.totalBookings} />
            <KpiStat title="Direct bookings" value={data.directBookings} hint="100% via public links" />
            <KpiStat title="Routed bookings" value={data.routedBookings} hint="Teams routing N/A in v1" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <InsightsChartCard title="Entry points by event slug">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.entryPoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="slug" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightsChartCard>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-foreground">Direct booking funnel</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Single-host clone — every booking comes from a public /book/&#123;slug&#125; link.
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {data.entryPoints.map((ep) => (
                  <li key={ep.slug} className="flex justify-between border-b border-border pb-2">
                    <span className="text-foreground">{ep.title}</span>
                    <span className="text-muted-foreground">{ep.count} bookings</span>
                  </li>
                ))}
                {data.entryPoints.length === 0 && (
                  <li className="text-muted-foreground">No bookings in this period.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
