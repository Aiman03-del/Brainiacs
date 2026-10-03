"use client";

import { useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import {
  ACCENTS,
  DEFAULT_ACCENT,
  DEFAULT_MOTION,
  DEFAULT_TEXT_SIZE,
  readAccentPreference,
  readMotionPreference,
  readTextSizePreference,
  saveAccentPreference,
  saveMotionPreference,
  saveTextSizePreference,
  saveThemePreference,
  TEXT_SIZES,
  THEME_EVENT,
  type AccentColor,
  type MotionPreference,
  type TextSize,
  type ThemePreference,
} from "@/lib/theme";
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

const accentOptions: Record<AccentColor, { label: string; color: string }> = {
  blue: { label: "Blue", color: "#2563eb" },
  emerald: { label: "Emerald", color: "#059669" },
  violet: { label: "Violet", color: "#7c3aed" },
  rose: { label: "Rose", color: "#e11d48" },
  amber: { label: "Amber", color: "#d97706" },
  teal: { label: "Teal", color: "#0d9488" },
};

const textSizeOptions: Record<
  TextSize,
  { label: string; description: string; sampleClass: string }
> = {
  small: { label: "Small", description: "Fit more on screen.", sampleClass: "text-xs" },
  default: { label: "Default", description: "Recommended size.", sampleClass: "text-base" },
  large: { label: "Large", description: "Easier to read.", sampleClass: "text-xl" },
};

function subscribePreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function useAccentPreference(): AccentColor {
  return useSyncExternalStore(
    subscribePreferences,
    readAccentPreference,
    (): AccentColor => DEFAULT_ACCENT,
  );
}

function useTextSizePreference(): TextSize {
  return useSyncExternalStore(
    subscribePreferences,
    readTextSizePreference,
    (): TextSize => DEFAULT_TEXT_SIZE,
  );
}

function useMotionPreference(): MotionPreference {
  return useSyncExternalStore(
    subscribePreferences,
    readMotionPreference,
    (): MotionPreference => DEFAULT_MOTION,
  );
}

export default function AppearanceForm() {
  const preference = useThemePreference();
  const accent = useAccentPreference();
  const textSize = useTextSizePreference();
  const motion = useMotionPreference();

  return (
    <>
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

      <div className="border-b border-border pb-5">
        <p id="accent-label" className="text-sm font-medium text-foreground">
          Accent color
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Choose the color used for buttons, links and highlights.
        </p>
        <div
          role="radiogroup"
          aria-labelledby="accent-label"
          className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6"
        >
          {ACCENTS.map((value) => {
            const { label, color } = accentOptions[value];
            const selected = accent === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={label}
                onClick={() => saveAccentPreference(value)}
                className={`flex min-h-11 flex-col items-center gap-2 rounded-lg border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  {selected && <Check className="h-4 w-4 text-white" />}
                </span>
                <span className="text-xs font-medium text-foreground">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-border pb-5">
        <p id="text-size-label" className="text-sm font-medium text-foreground">
          Text size
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Make text and spacing across the app smaller or larger.
        </p>
        <div
          role="radiogroup"
          aria-labelledby="text-size-label"
          className="mt-3 grid gap-3 sm:grid-cols-3"
        >
          {TEXT_SIZES.map((value) => {
            const { label, description, sampleClass } = textSizeOptions[value];
            const selected = textSize === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => saveTextSizePreference(value)}
                className={`flex min-h-11 flex-col items-start gap-1.5 rounded-lg border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                <span className="flex w-full items-center gap-2 text-sm font-medium text-foreground">
                  <span aria-hidden="true" className={`font-semibold ${sampleClass}`}>
                    Aa
                  </span>
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
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <p id="motion-label" className="text-sm font-medium text-foreground">
            Reduce motion
          </p>
          <p id="motion-description" className="mt-0.5 text-xs text-muted">
            Turn off animations and transitions across the app.
          </p>
        </div>
        <Switch
          checked={motion === "reduce"}
          onChange={(next) => saveMotionPreference(next ? "reduce" : "default")}
          labelledBy="motion-label"
          describedBy="motion-description"
        />
      </div>
    </>
  );
}
