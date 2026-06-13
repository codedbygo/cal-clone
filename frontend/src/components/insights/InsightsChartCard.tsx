import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  hint?: string;
}

export function KpiStat({ title, value, hint }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function InsightsChartCard({ title, description, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  );
}

export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground))",
  accent: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
};
