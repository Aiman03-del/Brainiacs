import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardList from "@/components/messenger/BoardList";
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
    .select("boards(id, name, theme)")
    .eq("user_id", user.id);

  const boards = (memberships ?? [])
    .map((membership) => membership.boards)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden rounded-2xl border bg-surface">
      <BoardList boards={boards} />
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
