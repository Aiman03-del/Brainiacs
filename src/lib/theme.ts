export const THEME_KEY = "brainiacs-theme";
export const ACCENT_KEY = "brainiacs-accent";
export const TEXT_SIZE_KEY = "brainiacs-text-size";
export const MOTION_KEY = "brainiacs-motion";
export const THEME_EVENT = "brainiacs-theme-change";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const ACCENTS = [
  "blue",
  "emerald",
  "violet",
  "rose",
  "amber",
  "teal",
] as const;
export type AccentColor = (typeof ACCENTS)[number];
export const DEFAULT_ACCENT: AccentColor = "blue";

export const TEXT_SIZES = ["small", "default", "large"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const DEFAULT_TEXT_SIZE: TextSize = "default";

export const MOTIONS = ["default", "reduce"] as const;
export type MotionPreference = (typeof MOTIONS)[number];
export const DEFAULT_MOTION: MotionPreference = "default";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

export function isTextSize(value: unknown): value is TextSize {
  return typeof value === "string" && (TEXT_SIZES as readonly string[]).includes(value);
}

export function isMotionPreference(value: unknown): value is MotionPreference {
  return typeof value === "string" && (MOTIONS as readonly string[]).includes(value);
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function readAccentPreference(): AccentColor {
  try {
    const stored = window.localStorage.getItem(ACCENT_KEY);
    return isAccentColor(stored) ? stored : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export function readTextSizePreference(): TextSize {
  try {
    const stored = window.localStorage.getItem(TEXT_SIZE_KEY);
    return isTextSize(stored) ? stored : DEFAULT_TEXT_SIZE;
  } catch {
    return DEFAULT_TEXT_SIZE;
  }
}

export function readMotionPreference(): MotionPreference {
  try {
    const stored = window.localStorage.getItem(MOTION_KEY);
    return isMotionPreference(stored) ? stored : DEFAULT_MOTION;
  } catch {
    return DEFAULT_MOTION;
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

export function applyAccent(accent: AccentColor): void {
  if (accent === DEFAULT_ACCENT) {
    delete document.documentElement.dataset.accent;
  } else {
    document.documentElement.dataset.accent = accent;
  }
}

export function applyTextSize(size: TextSize): void {
  if (size === DEFAULT_TEXT_SIZE) {
    delete document.documentElement.dataset.textSize;
  } else {
    document.documentElement.dataset.textSize = size;
  }
}

export function applyMotion(motion: MotionPreference): void {
  if (motion === DEFAULT_MOTION) {
    delete document.documentElement.dataset.motion;
  } else {
    document.documentElement.dataset.motion = motion;
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this session.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function saveAccentPreference(accent: AccentColor): void {
  try {
    window.localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // Storage can be unavailable (private mode); the accent still applies for this session.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function saveTextSizePreference(size: TextSize): void {
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    // Storage can be unavailable (private mode); the text size still applies for this session.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function saveMotionPreference(motion: MotionPreference): void {
  try {
    window.localStorage.setItem(MOTION_KEY, motion);
  } catch {
    // Storage can be unavailable (private mode); the motion setting still applies for this session.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Runs before first paint so the page never flashes the wrong theme, accent, text size or motion.
export const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;var p=localStorage.getItem("${THEME_KEY}");var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);root.dataset.theme=d?"dark":"light";var a=localStorage.getItem("${ACCENT_KEY}");if(a==="emerald"||a==="violet"||a==="rose"||a==="amber"||a==="teal"){root.dataset.accent=a;}else{delete root.dataset.accent;}var s=localStorage.getItem("${TEXT_SIZE_KEY}");if(s==="small"||s==="large"){root.dataset.textSize=s;}else{delete root.dataset.textSize;}var m=localStorage.getItem("${MOTION_KEY}");if(m==="reduce"){root.dataset.motion="reduce";}else{delete root.dataset.motion;}}catch(e){}})();`;
