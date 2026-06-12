"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  ExternalLink,
  Link2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/event-types", label: "Event types", icon: Calendar },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/availability", label: "Availability", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-[var(--cal-border)] bg-[var(--cal-sidebar)]">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--cal-border)] px-4">
        <span className="text-lg font-semibold tracking-tight">Cal.com</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--cal-active)] font-medium text-white"
                  : "text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-white",
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
          href={`${appUrl}/book/30-min`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </a>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(`${appUrl}/book/30-min`)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--cal-muted)] hover:bg-[var(--cal-hover)] hover:text-white"
        >
          <Link2 className="h-4 w-4" />
          Copy public page link
        </button>
      </div>
    </aside>
  );
}
