"use client";

import { Moon, Sun } from "lucide-react";
import { saveThemePreference } from "@/lib/theme";
import { useIsDarkTheme } from "./useThemePreference";

export function ThemeToggle() {
  const dark = useIsDarkTheme();

  const toggleTheme = () => {
    saveThemePreference(dark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      aria-pressed={dark}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {dark ? (
        <Sun aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Moon aria-hidden="true" className="h-4 w-4" />
      )}
      <span>{dark ? "Light theme" : "Dark theme"}</span>
    </button>
  );
}
