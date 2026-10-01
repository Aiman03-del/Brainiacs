import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessengerShell from "@/components/messenger/MessengerShell";
import type { ReactNode } from "react";

export default async function MessengerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("board_members")
    .select("boards(id, name, theme, visibility, description)")
    .eq("user_id", user.id);

  const boards = (memberships ?? [])
    .map((membership) => membership.boards)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));

  return <MessengerShell boards={boards}>{children}</MessengerShell>;
}
