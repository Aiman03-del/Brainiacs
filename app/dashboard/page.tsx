import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity as ActivityIcon,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MessageSquare,
  MessageSquarePlus,
  PanelsTopLeft,
  Plus,
  RotateCw,
  Search,
  TriangleAlert,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { ACTIVITY_SELECT } from "@/components/activity/constants";
import { createClient } from "@/lib/supabase/server";
import type { ActivityFeedRow } from "@/types";

interface DashboardMessage {
  id: string;
  board_id: string;
  text: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

interface DashboardTask {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  due_at: string | null;
  columns: { title: string } | null;
}

interface DashboardBoardMember {
  board_id: string;
  user_id: string;
  profiles: { display_name: string | null; photo_url: string | null } | null;
}

export default async function DashboardIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent userId={user.id} email={user.email ?? ""} />
    </Suspense>
  );
}

async function DashboardContent({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const supabase = await createClient();
  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("board_members")
      .select("role, boards(id, name, theme)")
      .eq("user_id", userId),
  ]);

  if (profileResult.error || membershipsResult.error) {
    console.error(
      "Dashboard query failed:",
      profileResult.error ?? membershipsResult.error,
    );
    return <DashboardError />;
  }

  const memberships = membershipsResult.data ?? [];
  const boards = memberships
    .map((membership) => membership.boards)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
  const boardIds = boards.map((board) => board.id);
  const boardNames = new Map(boards.map((board) => [board.id, board.name]));

  let activities: ActivityFeedRow[] = [];
  let messages: DashboardMessage[] = [];
  let tasks: DashboardTask[] = [];
  let completedTaskIds = new Set<string>();
  let boardMembers: DashboardBoardMember[] = [];
  let activityCount = 0;
  let taskCount = 0;
  let completedCount = 0;

  if (boardIds.length) {
    const [activitiesResult, messagesResult, tasksResult, completedResult, membersResult] =
      await Promise.all([
        supabase
          .from("activities")
          .select(ACTIVITY_SELECT, { count: "exact" })
          .in("board_id", boardIds)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("messages")
          .select("id, board_id, text, created_at, profiles(display_name)")
          .in("board_id", boardIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("tasks")
          .select("id, board_id, column_id, title, due_at, columns(title)", {
            count: "exact",
          })
          .in("board_id", boardIds)
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(60),
        supabase
          .from("completed_tasks")
          .select("task_id", { count: "exact" })
          .eq("user_id", userId),
        supabase
          .from("board_members")
          .select("board_id, user_id, profiles(display_name, photo_url)")
          .in("board_id", boardIds),
      ]);

    const failed = [
      activitiesResult,
      messagesResult,
      tasksResult,
      completedResult,
      membersResult,
    ].find((result) => result.error);

    if (failed) {
      console.error("Dashboard query failed:", failed.error);
      return <DashboardError />;
    }

    activities = activitiesResult.data ?? [];
    messages = messagesResult.data ?? [];
    tasks = tasksResult.data ?? [];
    completedTaskIds = new Set(
      (completedResult.data ?? []).map((task) => task.task_id),
    );
    boardMembers = membersResult.data ?? [];
    activityCount = activitiesResult.count ?? 0;
    taskCount = tasksResult.count ?? 0;
    completedCount = completedResult.count ?? 0;
  }

  const recentConversations = Array.from(
    messages.reduce((latestByBoard, message) => {
      if (!latestByBoard.has(message.board_id)) {
        latestByBoard.set(message.board_id, message);
      }
      return latestByBoard;
    }, new Map<string, DashboardMessage>()),
  )
    .map(([, message]) => message)
    .slice(0, 4);
  const myTasks = tasks
    .filter((task) => !completedTaskIds.has(task.id))
    .slice(0, 5);
  const displayName =
    profileResult.data?.display_name?.trim() || email.split("@")[0] || "there";
  const ownerBoard = boards.find((board) =>
    memberships.some(
      (membership) =>
        membership.boards?.id === board.id && membership.role === "owner",
    ),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Your workspace overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Good {getGreeting()}, {displayName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Here&apos;s what&apos;s moving across your boards today.
          </p>
        </div>
        <Link
          href="/dashboard/search"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Search aria-hidden="true" className="h-4 w-4 text-muted" />
          Search workspace
        </Link>
      </header>

      <section
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        aria-label="Workspace summary"
      >
        <Summary
          label="Your boards"
          value={boards.length}
          href="/dashboard/boards"
          icon={<PanelsTopLeft aria-hidden="true" className="h-4 w-4" />}
        />
        <Summary
          label="Tasks across boards"
          value={taskCount}
          href="/dashboard/tasks"
          icon={<ClipboardCheck aria-hidden="true" className="h-4 w-4" />}
        />
        <Summary
          label="Completed by you"
          value={completedCount}
          href="/dashboard/tasks"
          icon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
        />
        <Summary
          label="Workspace activity"
          value={activityCount}
          href="/dashboard/activity"
          icon={<ActivityIcon aria-hidden="true" className="h-4 w-4" />}
        />
      </section>

      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-3 text-base font-semibold text-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          <QuickAction
            href="/dashboard/messenger"
            icon={<MessageSquarePlus aria-hidden="true" className="h-4 w-4" />}
            label="New message"
          />
          <QuickAction
            href={boards[0] ? `/dashboard/boards/${boards[0].id}` : "/dashboard/boards"}
            icon={<Plus aria-hidden="true" className="h-4 w-4" />}
            label={boards.length ? "Create a task" : "Create a board"}
          />
          <QuickAction
            href="/dashboard/ai"
            icon={<Bot aria-hidden="true" className="h-4 w-4" />}
            label="Ask Brainiacs AI"
          />
          {ownerBoard && (
            <QuickAction
              href={`/dashboard/boards/${ownerBoard.id}`}
              icon={<Users aria-hidden="true" className="h-4 w-4" />}
              label="Invite a member"
            />
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <section className="min-w-0" aria-labelledby="recent-activity-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 id="recent-activity-title" className="text-lg font-semibold text-foreground">
                  Recent Activity
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  The latest updates from your boards.
                </p>
              </div>
              <Link href="/dashboard/activity" className="shrink-0 text-sm font-medium text-primary hover:underline">
                View all activity
              </Link>
            </div>
            {activities.length ? (
              <ul className="divide-y rounded-xl border border-border bg-surface">
                {activities.map((activity) => {
                  const Icon = getActivityIcon(activity);
                  const name = activity.profiles?.display_name ?? "A teammate";
                  return (
                    <li key={activity.id} className="flex items-start gap-3 px-3 py-3 sm:px-4">
                      <Avatar name={name} size={34} />
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="wrap-break-word text-sm leading-5 text-foreground">
                          {activity.message}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {name} · {activity.boards?.name ?? "Workspace"} · {formatTimestamp(activity.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<ActivityIcon aria-hidden="true" className="h-5 w-5" />}
                title="No recent activity."
                actionHref="/dashboard/boards"
                actionLabel="Open your boards"
              />
            )}
          </section>

          <section className="min-w-0" aria-labelledby="recent-conversations-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 id="recent-conversations-title" className="text-base font-semibold text-foreground">
                  Recent conversations
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  A quick look at the latest messages.
                </p>
              </div>
              <Link href="/dashboard/messenger" className="shrink-0 text-sm font-medium text-primary hover:underline">
                Open messages
              </Link>
            </div>
            {recentConversations.length ? (
              <ul className="divide-y rounded-xl border border-border bg-surface">
                {recentConversations.map((message) => (
                  <li key={message.id}>
                    <Link
                      href={`/dashboard/messenger/${message.board_id}`}
                      className="flex min-w-0 items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-hover sm:px-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                        <MessageSquare aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {boardNames.get(message.board_id) ?? "Board conversation"}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {message.profiles?.display_name ?? "A teammate"}: {message.text || "Shared an attachment"}
                        </span>
                      </span>
                      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<MessageSquare aria-hidden="true" className="h-5 w-5" />}
                title="No recent conversations."
                actionHref="/dashboard/messenger"
                actionLabel="Open messages"
              />
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section aria-labelledby="my-tasks-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 id="my-tasks-title" className="text-lg font-semibold text-foreground">
                  My tasks
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Uncompleted work across your boards.
                </p>
              </div>
              <Link href="/dashboard/tasks" className="shrink-0 text-sm font-medium text-primary hover:underline">
                View all tasks
              </Link>
            </div>
            {myTasks.length ? (
              <ul className="divide-y rounded-xl border border-border bg-surface">
                {myTasks.map((task) => {
                  const due = getDueLabel(task.due_at);
                  return (
                    <li key={task.id}>
                      <Link
                        href={`/dashboard/boards/${task.board_id}`}
                        className="block px-3 py-3 transition-colors hover:bg-surface-hover sm:px-4"
                      >
                        <span className="flex min-w-0 items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {task.title}
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted">
                              {boardNames.get(task.board_id) ?? "Board"}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-md bg-surface-muted px-2 py-1 text-xs text-muted">
                            {task.columns?.title ?? "No status"}
                          </span>
                        </span>
                        <span className={`mt-2 inline-flex items-center gap-1.5 text-xs ${due.overdue ? "font-medium text-danger" : "text-muted"}`}>
                          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                          {due.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
                title="No tasks to pick up right now."
                actionHref="/dashboard/tasks"
                actionLabel="Browse tasks"
              />
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="ai-help-title">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 id="ai-help-title" className="mt-3 font-semibold text-foreground">Need help?</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Ask Brainiacs AI to summarize, plan, or help with your work.
            </p>
            <Link
              href="/dashboard/ai"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Open AI Assistant <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </section>

          <section aria-labelledby="workspace-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="workspace-title" className="text-base font-semibold text-foreground">
                Your workspace
              </h2>
              <Link href="/dashboard/boards" className="text-sm font-medium text-primary hover:underline">
                All boards
              </Link>
            </div>
            {boards.length ? (
              <ul className="divide-y rounded-xl border border-border bg-surface">
                {boards.slice(0, 4).map((board) => {
                  const members = boardMembers.filter((member) => member.board_id === board.id);
                  return (
                    <li key={board.id}>
                      <Link
                        href={`/dashboard/boards/${board.id}`}
                        className="flex min-w-0 items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-hover"
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: board.theme }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{board.name}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                            <Users aria-hidden="true" className="h-3.5 w-3.5" />
                            {members.length} {members.length === 1 ? "member" : "members"}
                          </span>
                        </span>
                        <span className="flex -space-x-2">
                          {members.slice(0, 3).map((member) => (
                            <span key={member.user_id} className="rounded-full ring-2 ring-surface">
                              <Avatar
                                name={member.profiles?.display_name}
                                src={member.profiles?.photo_url}
                                size={24}
                              />
                            </span>
                          ))}
                        </span>
                        <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<PanelsTopLeft aria-hidden="true" className="h-5 w-5" />}
                title="No boards yet."
                actionHref="/dashboard/boards"
                actionLabel="Create or join a board"
              />
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-hover sm:p-4"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-6 text-foreground">{value}</span>
        <span className="mt-0.5 block truncate text-xs text-muted sm:text-sm">{label}</span>
      </span>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4"
    >
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-foreground">{title}</span>
        <Link href={actionHref} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
          {actionLabel}
        </Link>
      </span>
    </div>
  );
}

function DashboardError() {
  return (
    <section role="alert" className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-8 text-center">
      <TriangleAlert aria-hidden="true" className="mx-auto h-8 w-8 text-muted" />
      <h1 className="mt-3 text-lg font-semibold text-foreground">Something went wrong.</h1>
      <p className="mt-1 text-sm text-muted">Your dashboard couldn&apos;t load. Please try again.</p>
      <a href="/dashboard" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
        <RotateCw aria-hidden="true" className="h-4 w-4" />Try again
      </a>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" aria-busy="true" className="mx-auto max-w-6xl space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-36 rounded bg-surface-muted" />
        <div className="h-8 w-64 max-w-full rounded bg-surface-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-surface-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-16 rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-11 min-w-36 flex-1 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-3">
          <div className="h-6 w-40 rounded bg-surface-muted" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-surface-muted" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getActivityIcon(activity: ActivityFeedRow): LucideIcon {
  if (activity.entity.toLowerCase() === "task") {
    return activity.action.toLowerCase() === "done" ? CheckCircle2 : ClipboardCheck;
  }
  if (activity.entity.toLowerCase().includes("message")) return MessageSquare;
  if (activity.entity.toLowerCase().includes("member")) return UserRound;
  return ActivityIcon;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDueLabel(value: string | null): { label: string; overdue: boolean } {
  if (!value) return { label: "No due date", overdue: false };
  const dueDate = new Date(value);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const overdue = dueDate < startOfToday;
  const formattedDate = dueDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return {
    label: overdue ? `Overdue · ${formattedDate}` : `Due ${formattedDate}`,
    overdue,
  };
}