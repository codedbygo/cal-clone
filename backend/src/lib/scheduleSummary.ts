const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface Rule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  if (m === 0) return `${hour12}:00 ${period}`;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDayRange(days: number[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return DAY_SHORT[days[0]!]!;

  const sorted = [...days].sort((a, b) => a - b);
  const runs: number[][] = [];
  let run: number[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur === prev + 1 || (prev === 6 && cur === 0)) {
      run.push(cur);
    } else {
      runs.push(run);
      run = [cur];
    }
  }
  runs.push(run);

  return runs
    .map((r) => {
      if (r.length === 1) return DAY_SHORT[r[0]!]!;
      return `${DAY_SHORT[r[0]!]!} - ${DAY_SHORT[r[r.length - 1]!]!}`;
    })
    .join(", ");
}

export function formatScheduleSummary(rules: Rule[]): string {
  if (rules.length === 0) return "No hours set";

  const byWindow = new Map<string, number[]>();
  for (const r of rules) {
    const key = `${r.startTime}-${r.endTime}`;
    const days = byWindow.get(key) ?? [];
    days.push(r.dayOfWeek);
    byWindow.set(key, days);
  }

  return [...byWindow.entries()]
    .map(([window, days]) => {
      const [start, end] = window.split("-");
      return `${formatDayRange(days)}, ${formatTime12h(start!)} - ${formatTime12h(end!)}`;
    })
    .join(" · ");
}

export function pickDefaultSchedule<
  T extends { isDefault: boolean; updatedAt: Date },
>(schedules: T[]): T | null {
  if (schedules.length === 0) return null;
  return schedules.find((s) => s.isDefault) ?? schedules[0]!;
}
