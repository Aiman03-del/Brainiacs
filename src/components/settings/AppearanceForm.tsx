"use client";

import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { saveThemePreference, type ThemePreference } from "@/lib/theme";
import { useThemePreference } from "@/components/ui/useThemePreference";

const options: {
  value: ThemePreference;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { value: "light", label: "Light", description: "Bright surfaces for daytime use.", icon: Sun },
  { value: "dark", label: "Dark", description: "Easier on the eyes in low light.", icon: Moon },
  { value: "system", label: "System", description: "Match your device setting.", icon: Monitor },
];

export default function AppearanceForm() {
  const preference = useThemePreference();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid gap-3 border-y border-border py-5 sm:grid-cols-3"
    >
      {options.map(({ value, label, description, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => saveThemePreference(value)}
            className={`flex min-h-11 flex-col items-start gap-1.5 rounded-lg border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              selected
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <span className="flex w-full items-center gap-2 text-sm font-medium text-foreground">
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
              {selected && (
                <Check aria-hidden="true" className="ml-auto h-4 w-4 text-primary" />
              )}
            </span>
            <span className="text-xs text-muted">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
