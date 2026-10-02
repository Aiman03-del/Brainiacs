import { Suspense } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivityFeed, {
  ActivitySkeleton,
} from "@/components/activity/ActivityFeed";
import {
  ACTIVITY_PAGE_SIZE,
  ACTIVITY_SELECT,
} from "@/components/activity/constants";

export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl">
          <ActivityPageHeader />
          <ActivitySkeleton />
        </div>
      }
    >
      <ActivityPageContent />
    </Suspense>
  );
}

async function ActivityPageContent() {
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
      <ActivityPageHeader />
      <ActivityFeed
        boards={boards}
        initialRows={activitiesResult.data ?? []}
        initialError={Boolean(activitiesResult.error)}
        userId={user.id}
      />
    </div>
  );
}

function ActivityPageHeader() {
  return (
    <header className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
        <ActivityIcon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="mt-1 text-sm text-muted">
          Stay up to date with what&apos;s happening across your workspace.
        </p>
      </div>
    </header>
  );
}
