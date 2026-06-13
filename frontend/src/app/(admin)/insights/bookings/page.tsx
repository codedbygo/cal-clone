"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getInsightsBookings } from "@/lib/api";
import type { InsightsBookingsData } from "@/lib/types";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import {
  CHART_COLORS,
  InsightsChartCard,
  KpiStat,
} from "@/components/insights/InsightsChartCard";
import { InsightsSubNav } from "@/components/insights/InsightsSubNav";

export default function InsightsBookingsPage() {
  const [data, setData] = useState<InsightsBookingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInsightsBookings()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <AdminPageShell
      title="Insights"
      description="See what's getting booked, and what's not — turn booking data into clarity."
    >
      <InsightsSubNav />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiStat title="Total bookings" value={data.total} hint={`Last ${data.days} days`} />
            <KpiStat title="Confirmed" value={data.confirmed} />
            <KpiStat title="Cancelled" value={data.cancelled} />
            <KpiStat title="Cancellation rate" value={`${data.cancellationRate}%`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <InsightsChartCard title="Daily booking volume" description="Confirmed bookings over time">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </InsightsChartCard>

            <InsightsChartCard title="By event type">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byEventType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightsChartCard>

            <InsightsChartCard title="By day of week">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightsChartCard>

            <InsightsChartCard title="By hour of day">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightsChartCard>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
