"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/lib/settings";

export function useUserSettings(userId: string, initial: UserSettings) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [settings, setSettings] = useState<UserSettings>(initial);
  const [saving, setSaving] = useState(false);

  const update = async (patch: Partial<UserSettings>): Promise<void> => {
    if (saving) return;

    const previous = settings;
    setSettings({ ...settings, ...patch });
    setSaving(true);

    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: userId,
          ...patch,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        setSettings(previous);
        toast.error("Unable to save your settings. Please try again.");
        return;
      }

      toast.success("Settings saved.");
      router.refresh();
    } catch {
      setSettings(previous);
      toast.error("Unable to save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return { settings, saving, update };
}
