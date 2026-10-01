import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import MembersButton from "@/components/boards/MembersButton";

export default async function BoardPage({ params }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: membership } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const [
    boardResult,
    columnsResult,
    tasksResult,
    membersResult,
    completedResult,
  ] = await Promise.all([
    supabase
      .from("boards")
      .select("id, name, description, theme")
      .eq("id", id)
      .single(),
    supabase
      .from("columns")
      .select("*")
      .eq("board_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("tasks")
      .select("*")
      .eq("board_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("board_members")
      .select("user_id, role, profiles(display_name, photo_url, email)")
      .eq("board_id", id)
      .order("joined_at", { ascending: true }),
    supabase.from("completed_tasks").select("task_id").eq("user_id", user.id),
  ]);

  const board = boardResult.data;

  if (!board) notFound();

  return (
    <div className="w-full">
      <Link href="/dashboard/boards" className="text-sm text-primary">
        &larr; Back to boards
      </Link>

      <div
        className="mb-5 mt-3 flex items-start justify-between gap-4 rounded-2xl bg-surface p-5 shadow-sm"
        style={{ borderTop: `6px solid ${board.theme}` }}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{board.name}</h1>
          {board.description && (
            <p className="mt-1 text-muted">{board.description}</p>
          )}
        </div>
        <MembersButton
          boardId={board.id}
          userId={user.id}
          isOwner={membership.role === "owner"}
          members={membersResult.data ?? []}
        />
      </div>

      <KanbanBoard
        boardId={board.id}
        userId={user.id}
        initialColumns={columnsResult.data ?? []}
        initialTasks={tasksResult.data ?? []}
        initialCompleted={(completedResult.data ?? []).map(
          (row) => row.task_id,
        )}
      />
    </div>
  );
}
