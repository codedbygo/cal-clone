"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/insights/bookings", label: "Bookings" },
  { href: "/insights/routing", label: "Routing" },
  { href: "/insights/router-position", label: "Router position" },
  { href: "/insights/call-history", label: "Call history" },
  { href: "/insights/wrong-routing", label: "Wrong routing" },
];

export function InsightsSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-border pb-4">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            pathname === href
              ? "bg-accent font-medium text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
