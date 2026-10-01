import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-surface p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    profileResult,
    boardsResult,
    messagesResult,
    pointsResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, photo_url, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("board_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("leaderboard")
      .select("points")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("completed_tasks")
      .select("completed_at, tasks(title, boards(name))")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5),
  ]);

  const profile = profileResult.data;
  const points = pointsResult.data?.points ?? 0;

  const { count: ahead } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("points", points);

  const rank = (ahead ?? 0) + 1;
  const name = profile?.display_name ?? user.email;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const recentTasks = recentResult.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-5 rounded-2xl border bg-surface p-6">
        <Avatar name={name} src={profile?.photo_url} size={80} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-foreground">
            {name}
          </h1>
          <p className="truncate text-sm text-muted">{profile?.email}</p>
          {memberSince && (
            <p className="mt-1 text-xs text-muted">
              Member since {memberSince}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/settings"
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
        >
          Edit profile
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Points" value={points} />
        <Stat label="Leaderboard rank" value={`#${rank}`} />
        <Stat label="Boards" value={boardsResult.count ?? 0} />
        <Stat label="Messages sent" value={messagesResult.count ?? 0} />
      </div>

      <div className="rounded-2xl border bg-surface p-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Recently completed tasks
        </h2>

        {recentTasks.length === 0 ? (
          <p className="text-sm text-muted">
            You have not completed any task yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentTasks.map((row, index) => (
              <li
                key={`${row.completed_at}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {row.tasks?.title ?? "Task no longer available"}
                  </p>
                  {row.tasks?.boards?.name && (
                    <p className="truncate text-xs text-muted">
                      {row.tasks.boards.name}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 text-xs text-muted"
                  suppressHydrationWarning
                >
                  {new Date(row.completed_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
