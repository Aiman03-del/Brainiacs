import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskWorkspace from "@/components/kanban/TaskWorkspace";
import type { TaskOverviewRecord } from "@/components/kanban/TaskWorkspace";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("board_members")
    .select("boards(id, name)")
    .eq("user_id", user.id);

  if (membershipError) return <TaskLoadError />;

  const boards = (memberships ?? [])
    .map((membership) => membership.boards)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
  const boardIds = boards.map((board) => board.id);
  const boardNames = new Map(boards.map((board) => [board.id, board.name]));

  if (!boardIds.length) return <TaskWorkspace tasks={[]} boards={[]} />;

  const [tasksResult, completedResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, board_id, title, description, due_at, created_at, columns(title)")
      .in("board_id", boardIds)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("completed_tasks")
      .select("task_id")
      .eq("user_id", user.id),
  ]);

  if (tasksResult.error || completedResult.error) return <TaskLoadError />;

  const completedTaskIds = new Set(
    (completedResult.data ?? []).map((task) => task.task_id),
  );
  const tasks: TaskOverviewRecord[] = (tasksResult.data ?? []).map((task) => ({
    id: task.id,
    boardId: task.board_id,
    boardName: boardNames.get(task.board_id) ?? "Board",
    title: task.title,
    description: task.description,
    status: task.columns?.title ?? "No column",
    dueAt: task.due_at,
    createdAt: task.created_at,
    completedByCurrentUser: completedTaskIds.has(task.id),
  }));

  return <TaskWorkspace tasks={tasks} boards={boards} />;
}

function TaskLoadError() {
  return (
    <ErrorState
      title="Tasks couldn't load."
      description="Your tasks are temporarily unavailable. Try again in a moment."
    />
  );
}