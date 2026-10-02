"use client";

import { Check, Globe, Lock, type LucideIcon } from "lucide-react";
import type { AllowInvites, UserSettings } from "@/lib/settings";
import { useUserSettings } from "./useUserSettings";

interface PrivacyFormProps {
  userId: string;
  initial: UserSettings;
}

const options: {
  value: AllowInvites;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "everyone",
    label: "Everyone",
    description: "Anyone on Brainiacs can invite you to a board.",
    icon: Globe,
  },
  {
    value: "nobody",
    label: "Nobody",
    description:
      "New invitations are blocked. Invitations you already received stay as they are.",
    icon: Lock,
  },
];

export default function PrivacyForm({ userId, initial }: PrivacyFormProps) {
  const { settings, saving, update } = useUserSettings(userId, initial);

  return (
    <div className="space-y-3 border-y border-border py-5">
      <p id="invite-privacy-label" className="text-sm font-medium text-foreground">
        Who can invite you to boards
      </p>
      <div
        role="radiogroup"
        aria-labelledby="invite-privacy-label"
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map(({ value, label, description, icon: Icon }) => {
          const selected = settings.allow_invites === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={saving}
              onClick={() => {
                if (!selected) update({ allow_invites: value });
              }}
              className={`flex min-h-11 flex-col items-start gap-1.5 rounded-lg border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${
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
    </div>
  );
}
