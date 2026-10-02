"use client";

import { useEffect } from "react";
import { applyTheme, readThemePreference, THEME_EVENT } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(readThemePreference());

    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener(THEME_EVENT, sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(THEME_EVENT, sync);
    };
  }, []);

  return null;
}
