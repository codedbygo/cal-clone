"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function ThemeToggle({ className }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          Dark mode
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Light mode
        </>
      )}
    </button>
  );
}
