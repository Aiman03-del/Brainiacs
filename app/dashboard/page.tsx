import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("board_members")
      .select("boards(id, name, theme)")
      .eq("user_id", user.id),
  ]);

  const boards = (membershipsResult.data ?? [])
    .map((membership) => membership.boards)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
  const boardIds = boards.map((board) => board.id);
  const boardNames = new Map(boards.map((board) => [board.id, board.name]));

  const [activitiesResult, messagesResult, tasksResult] = boardIds.length
    ? await Promise.all([
        supabase
          .from("activities")
          .select("id, board_id, message, created_at")
          .in("board_id", boardIds)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("messages")
          .select("id, board_id, text, created_at")
          .in("board_id", boardIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .in("board_id", boardIds),
      ])
    : [{ data: [] }, { data: [] }, { count: 0 }];

  const seenChannelIds = new Set<string>();
  const messages = (messagesResult.data ?? []).filter((message) => {
    if (seenChannelIds.has(message.board_id)) return false;
    seenChannelIds.add(message.board_id);
    return true;
  }).slice(0, 5);
  const activities = activitiesResult.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Your workspace</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">
            Welcome back{profileResult.data?.display_name
              ? `, ${profileResult.data.display_name}`
              : ""}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/boards"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Open channels
          </Link>
          <Link
            href="/dashboard/ai"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover"
          >
            Ask Brainiacs AI
          </Link>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Workspace summary"
      >
        <Summary
          label="Channels"
          value={boards.length}
          href="/dashboard/boards"
        />
        <Summary
          label="Tasks"
          value={tasksResult.count ?? 0}
          href="/dashboard/tasks"
        />
        <Summary
          label="Recent updates"
          value={activities.length}
          href="/dashboard/activity"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent conversations</h2>
            <Link href="/dashboard/messenger" className="text-sm text-primary">
              View messages
            </Link>
          </div>
          {messages.length ? (
            <ul className="divide-y rounded-xl border bg-surface">
              {messages.map((message) => (
                <li key={message.id}>
                  <Link
                    href={`/dashboard/messenger/${message.board_id}`}
                    className="block px-4 py-3 hover:bg-surface-hover"
                  >
                    <p className="text-xs font-semibold text-muted">
                      {boardNames.get(message.board_id) ?? "Channel"}
                    </p>
                    <p className="mt-1 truncate text-sm text-foreground">
                      {message.text || "Attachment or shared item"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLink
              href="/dashboard/boards"
              text="Start a conversation in one of your channels."
            />
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workspace activity</h2>
            <Link href="/dashboard/activity" className="text-sm text-primary">
              View activity
            </Link>
          </div>
          {activities.length ? (
            <ul className="divide-y rounded-xl border bg-surface">
              {activities.map((activity) => (
                <li key={activity.id} className="px-4 py-3">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {boardNames.get(activity.board_id) ?? "Workspace"} ·{" "}
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLink
              href="/dashboard/activity"
              text="New workspace updates will appear here."
            />
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your channels</h2>
            <div className="flex gap-4">
              <Link
                href="/dashboard/leaderboard"
                className="text-sm text-primary"
              >
                Leaderboard
              </Link>
              <Link href="/dashboard/tasks" className="text-sm text-primary">
                Browse tasks
              </Link>
            </div>
        </div>
        {boards.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {boards.slice(0, 6).map((board) => (
              <li key={board.id}>
                <Link
                  href={`/dashboard/boards/${board.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-surface p-4 hover:bg-surface-hover"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: board.theme }}
                  />
                  <span className="truncate font-medium">{board.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLink
            href="/dashboard/boards"
            text="Create a channel to get started."
          />
        )}
      </section>
    </div>
  );
}

function Summary({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-surface p-4 hover:bg-surface-hover"
    >
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Link>
  );
}

function EmptyLink({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-dashed p-6 text-sm text-muted hover:bg-surface-hover"
    >
      {text}
    </Link>
  );
}
