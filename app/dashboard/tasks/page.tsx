import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskWorkspace from "@/components/kanban/TaskWorkspace";
import type { TaskOverviewRecord } from "@/components/kanban/TaskWorkspace";

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
    <section role="alert" className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold text-foreground">Unable to load tasks.</h1>
      <p className="mt-1 text-sm text-muted">Please try again.</p>
      <Link href="/dashboard/tasks" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
        Try again
      </Link>
    </section>
  );
}