"use client";

import { useSyncExternalStore } from "react";
import {
  readThemePreference,
  resolveTheme,
  THEME_EVENT,
  type ThemePreference,
} from "@/lib/theme";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribe,
    readThemePreference,
    (): ThemePreference => "system",
  );
}

export function useIsDarkTheme(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => resolveTheme(readThemePreference()) === "dark",
    () => false,
  );
}
