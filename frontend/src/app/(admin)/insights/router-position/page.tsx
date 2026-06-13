"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getInsightsRouterPosition } from "@/lib/api";
import type { InsightsRouterPositionData } from "@/lib/types";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { CHART_COLORS, InsightsChartCard, KpiStat } from "@/components/insights/InsightsChartCard";
import { InsightsSubNav } from "@/components/insights/InsightsSubNav";

export default function InsightsRouterPositionPage() {
  const [data, setData] = useState<InsightsRouterPositionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInsightsRouterPosition()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <AdminPageShell
      title="Insights"
      description="Availability utilization — booked time vs open hours on your default schedule."
    >
      <InsightsSubNav />
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiStat
              title="Overall utilization"
              value={`${data.overallUtilization}%`}
              hint={`Timezone: ${data.timezone}`}
            />
            <KpiStat title="Period" value={`${data.days} days`} />
          </div>

          <div className="mt-6">
            <InsightsChartCard
              title="Utilization by weekday"
              description="Booked minutes as % of available minutes"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byWeekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="utilization" fill={CHART_COLORS.rose} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightsChartCard>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
