const ACCENTS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
] as const;

export function getEventAccent(slug: string): (typeof ACCENTS)[number] {
  let hash = 0;
  for (const char of slug) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length]!;
}
