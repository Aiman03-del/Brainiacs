export type AllowInvites = "everyone" | "nobody";

export interface UserSettings {
  notify_invites: boolean;
  notify_task_reminders: boolean;
  allow_invites: AllowInvites;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notify_invites: true,
  notify_task_reminders: true,
  allow_invites: "everyone",
};
