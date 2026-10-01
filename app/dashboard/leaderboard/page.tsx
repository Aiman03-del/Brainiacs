import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rows, error } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, photo_url, points")
    .order("points", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Leaderboard</h1>
      <p className="mb-6 text-sm text-muted">
        Each completed task earns 1 point.
      </p>

      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          Failed to load leaderboard: {error.message}
        </p>
      )}

      <ol className="space-y-2">
        {(rows ?? []).map((row, index) => {
          const isMe = row.user_id === user.id;

          return (
            <li
              key={row.user_id}
              className={`flex items-center gap-4 rounded-xl border bg-surface p-3 ${
                isMe ? "border-primary" : ""
              }`}
            >
              <span className="w-8 text-center text-lg font-bold text-muted">
                {index + 1}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {(row.display_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {row.display_name ?? "Unknown"}
                {isMe && " (you)"}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {row.points} pts
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
