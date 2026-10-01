import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivityFeed from "@/components/activity/ActivityFeed";
import {
  ACTIVITY_PAGE_SIZE,
  ACTIVITY_SELECT,
} from "@/components/activity/constants";

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [activitiesResult, boardsResult] = await Promise.all([
    supabase
      .from("activities")
      .select(ACTIVITY_SELECT)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_PAGE_SIZE),
    supabase
      .from("board_members")
      .select("boards(id, name)")
      .eq("user_id", user.id),
  ]);

  const boards = (boardsResult.data ?? [])
    .map((membership) => membership.boards)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Activity log</h1>
      <p className="mb-6 text-sm text-muted">
        Everything that happens on your boards, newest first.
      </p>

      <ActivityFeed
        boards={boards}
        initialRows={activitiesResult.data ?? []}
        userId={user.id}
      />
    </div>
  );
}
