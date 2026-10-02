import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/lib/settings";
import AuthenticatedAppShell from "@/components/app/AuthenticatedAppShell";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, invitesResult, settingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, photo_url, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("join_requests")
      .select(
        "id, board_id, created_at, boards(name), sender:profiles!sender_id(display_name)",
      )
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_settings")
      .select("notify_invites, notify_task_reminders, allow_invites")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const email = profile?.email ?? user.email ?? "";
  const name = profile?.display_name ?? (email || "Brainiacs user");
  const settings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    ...(settingsResult.data ?? {}),
  };

  return (
    <AuthenticatedAppShell
      userId={user.id}
      name={name}
      email={email}
      photoUrl={profile?.photo_url ?? null}
      initialInvites={invitesResult.data ?? []}
      settings={settings}
    >
      {children}
    </AuthenticatedAppShell>
  );
}
