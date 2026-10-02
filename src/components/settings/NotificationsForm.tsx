"use client";

import { Switch } from "@/components/ui/Switch";
import type { UserSettings } from "@/lib/settings";
import { useUserSettings } from "./useUserSettings";

interface NotificationsFormProps {
  userId: string;
  initial: UserSettings;
}

interface SettingRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}

function SettingRow({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: SettingRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground">
          {label}
        </p>
        <p id={`${id}-description`} className="mt-0.5 text-xs text-muted">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        labelledBy={`${id}-label`}
        describedBy={`${id}-description`}
      />
    </li>
  );
}

export default function NotificationsForm({
  userId,
  initial,
}: NotificationsFormProps) {
  const { settings, saving, update } = useUserSettings(userId, initial);

  return (
    <ul className="divide-y divide-border border-y border-border">
      <SettingRow
        id="notify-invites"
        label="Board invitations"
        description="Show a pop-up when someone invites you to a board."
        checked={settings.notify_invites}
        disabled={saving}
        onChange={(next) => update({ notify_invites: next })}
      />
      <SettingRow
        id="notify-task-reminders"
        label="Task reminders"
        description="Show a pop-up before a task is due, based on the reminder set on the task. Works while Brainiacs is open in your browser."
        checked={settings.notify_task_reminders}
        disabled={saving}
        onChange={(next) => update({ notify_task_reminders: next })}
      />
    </ul>
  );
}
