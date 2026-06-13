import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  description,
  actions,
  headerExtra,
  children,
}: Props) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="shrink-0 border-b border-[var(--cal-border)] bg-[var(--cal-card)] px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--cal-text)]">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-xl text-sm text-[var(--cal-muted)]">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
        {headerExtra}
      </header>
      <div className="flex-1 px-6 py-6 pb-16 lg:px-8">{children}</div>
    </div>
  );
}
