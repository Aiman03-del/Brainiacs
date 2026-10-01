import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import InvitesBell from "@/components/InvitesBell";
import Avatar from "@/components/Avatar";
import type { ReactNode } from "react";

const navLink = "text-sm text-muted hover:text-foreground";

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

  const [profileResult, invitesResult] = await Promise.all([
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
  ]);

  const profile = profileResult.data;
  const name = profile?.display_name ?? user.email;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface px-6 py-3">
        <nav className="flex flex-wrap items-center gap-6">
          <Link href="/dashboard/boards" className="text-lg font-bold">
            Brainiacs
          </Link>
          <Link href="/dashboard/boards" className={navLink}>
            Boards
          </Link>
          <Link href="/dashboard/messenger" className={navLink}>
            Messenger
          </Link>
          <Link href="/dashboard/leaderboard" className={navLink}>
            Leaderboard
          </Link>
          <Link href="/dashboard/ai" className={navLink}>
            AI Assistant
          </Link>
          <Link href="/dashboard/activity" className={navLink}>
            Activity
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <InvitesBell
            userId={user.id}
            initialInvites={invitesResult.data ?? []}
          />
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-hover"
          >
            <Avatar name={name} src={profile?.photo_url} size={30} />
            <span className="text-sm text-foreground">{name}</span>
          </Link>

          <Link href="/dashboard/settings" className={navLink}>
            Settings
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
