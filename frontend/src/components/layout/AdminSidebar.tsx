"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Link2,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/event-types", label: "Event types", icon: Calendar },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/availability", label: "Availability", icon: Clock },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/book/30-min`;
  const [copied, setCopied] = useState(false);

  async function handleCopyPublicLink() {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-[var(--cal-border)] px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cal-primary)] text-xs font-semibold text-[var(--cal-primary-fg)]">
          DH
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--cal-text)]">
            Default Host
          </p>
          <p className="truncate text-xs text-[var(--cal-muted)]">host@example.com</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--cal-active)] font-medium text-[var(--cal-text)]"
                  : "text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-[var(--cal-text)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-[var(--cal-border)] p-2">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-[var(--cal-text)]"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </a>
        <button
          type="button"
          onClick={() => void handleCopyPublicLink()}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            copied
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-[var(--cal-text)]",
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Copy public page link
            </>
          )}
        </button>
        <ThemeToggle />
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md border border-[var(--cal-border)] bg-[var(--cal-card)] p-2 text-[var(--cal-text)] shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-[var(--cal-border)] bg-[var(--cal-sidebar)] transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--cal-border)] px-4 lg:hidden">
          <span className="text-lg font-semibold text-[var(--cal-text)]">Cal.com</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-[var(--cal-muted)] hover:bg-[var(--cal-hover)]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="hidden h-14 items-center border-b border-[var(--cal-border)] px-4 lg:flex">
          <span className="text-lg font-semibold tracking-tight text-[var(--cal-text)]">
            Cal.com
          </span>
        </div>
        <NavLinks onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
