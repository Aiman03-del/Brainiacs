import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TasksPage() {
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
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <p className="mt-1 text-sm text-muted">
          Open a board to manage its Kanban tasks and workflow.
        </p>
      </header>
      {boards.length ? (
        <ul className="divide-y rounded-xl border bg-surface">
          {boards.map((board) => (
            <li key={board.id} className="flex items-center gap-4 px-4 py-4">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: board.theme }}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {board.name}
              </span>
              <Link
                href={`/dashboard/boards/${board.id}`}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-hover"
              >
                Open tasks
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted">Create or join a channel to manage tasks.</p>
          <Link href="/dashboard/boards" className="mt-4 inline-block text-sm font-medium text-primary">
            Browse channels
          </Link>
        </div>
      )}
    </div>
  );
}