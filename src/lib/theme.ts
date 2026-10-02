export const THEME_KEY = "brainiacs-theme";
export const THEME_EVENT = "brainiacs-theme-change";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return preference;
}

export function applyTheme(preference: ThemePreference): void {
  document.documentElement.dataset.theme = resolveTheme(preference);
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this session.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Runs before first paint so the page never flashes the wrong theme.
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_KEY}");var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;
