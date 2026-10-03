"use client";

import { useEffect } from "react";
import {
  applyAccent,
  applyMotion,
  applyTextSize,
  applyTheme,
  readAccentPreference,
  readMotionPreference,
  readTextSizePreference,
  readThemePreference,
  THEME_EVENT,
} from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      applyTheme(readThemePreference());
      applyAccent(readAccentPreference());
      applyTextSize(readTextSizePreference());
      applyMotion(readMotionPreference());
    };

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
