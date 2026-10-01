import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import InvitesBell from "@/components/InvitesBell";
import Avatar from "@/components/Avatar";
import AppNavigation from "@/components/app/AppNavigation";
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
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-surface px-3 py-5 lg:flex">
        <Link href="/dashboard" className="mb-7 px-3 text-lg font-bold">
          Brainiacs
        </Link>
        <AppNavigation />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-surface px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-lg font-bold lg:hidden">
            Brainiacs
          </Link>
          <p className="hidden text-sm font-medium text-muted lg:block">
            Team workspace
          </p>
          <div className="ml-auto flex items-center gap-3">
            <InvitesBell
              userId={user.id}
              initialInvites={invitesResult.data ?? []}
            />
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-hover"
            >
              <Avatar name={name} src={profile?.photo_url} size={30} />
              <span className="hidden max-w-40 truncate text-sm text-foreground sm:block">
                {name}
              </span>
            </Link>
            <SignOutButton />
          </div>
        </header>

        <div className="border-b bg-surface px-2 py-2 lg:hidden">
          <AppNavigation variant="mobile" />
        </div>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
