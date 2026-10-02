import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Mail,
  Pencil,
  Shield,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    profileResult,
    membershipsResult,
    messagesResult,
    pointsResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, photo_url, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("board_members")
      .select("role, joined_at, boards(id, name)", { count: "exact" })
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

  const aheadResult = pointsResult.data
    ? await supabase
        .from("leaderboard")
        .select("*", { count: "exact", head: true })
        .gt("points", pointsResult.data.points)
    : null;
  const profile = profileResult.data;
  const name =
    profile?.display_name?.trim() ||
    (typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : "") ||
    user.email ||
    "Brainiacs member";
  const email = profile?.email ?? user.email ?? "";
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(profile.created_at))
    : null;
  const memberships = membershipsResult.data ?? [];
  const recentTasks = recentResult.data ?? [];
  const stats = [
    ...(pointsResult.data && !pointsResult.error
      ? [{ label: "Points", value: pointsResult.data.points }]
      : []),
    ...(aheadResult && !aheadResult.error && aheadResult.count !== null
      ? [{ label: "Leaderboard rank", value: `#${aheadResult.count + 1}` }]
      : []),
    ...(!membershipsResult.error && membershipsResult.count !== null
      ? [{ label: "Boards", value: membershipsResult.count }]
      : []),
    ...(!messagesResult.error && messagesResult.count !== null
      ? [{ label: "Messages sent", value: messagesResult.count }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Your account</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Profile</h1>
        </div>
        <Link
          href="/dashboard/settings#account"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Edit profile
        </Link>
      </header>

      <section
        aria-labelledby="profile-identity-title"
        className="border-y border-border py-6 sm:py-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={name} src={profile?.photo_url} size={88} />
          <div className="min-w-0 flex-1">
            <h2
              id="profile-identity-title"
              className="break-words text-2xl font-semibold text-foreground"
            >
              {name}
            </h2>
            {email && (
              <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted">
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="break-all">{email}</span>
              </p>
            )}
            {memberSince && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
                Member since {memberSince}
              </p>
            )}
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <dl
          aria-label="Profile summary"
          className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="px-3 py-4 sm:px-4">
              <dt className="text-xs text-muted">{stat.label}</dt>
              <dd className="mt-1 text-xl font-semibold text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <section aria-labelledby="workspace-membership-title">
        <div className="mb-3 flex items-center gap-2">
          <Users aria-hidden="true" className="h-4 w-4 text-muted" />
          <h2
            id="workspace-membership-title"
            className="text-base font-semibold text-foreground"
          >
            Workspace membership
          </h2>
        </div>
        {membershipsResult.error ? (
          <p role="alert" className="text-sm text-danger">
            Unable to load workspace memberships.
          </p>
        ) : memberships.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {memberships.map((membership) => (
              <li
                key={membership.boards?.id ?? `${membership.role}-${membership.joined_at}`}
                className="flex min-h-14 flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {membership.boards?.name ?? "Workspace"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Shield aria-hidden="true" className="h-4 w-4" />
                  {membership.role === "owner" ? "Owner" : "Member"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No workspace memberships yet.</p>
        )}
      </section>

      <section aria-labelledby="profile-activity-title">
        <div className="mb-3 flex items-center gap-2">
          <Activity aria-hidden="true" className="h-4 w-4 text-muted" />
          <h2
            id="profile-activity-title"
            className="text-base font-semibold text-foreground"
          >
            Recently completed tasks
          </h2>
        </div>
        {recentResult.error ? (
          <p role="alert" className="text-sm text-danger">
            Unable to load recent tasks.
          </p>
        ) : recentTasks.length === 0 ? (
          <div className="border-y border-border py-5">
            <span className="flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              No completed tasks yet.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {recentTasks.map((row, index) => (
              <li
                key={`${row.completed_at}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-foreground">
                    {row.tasks?.title ?? "Task no longer available"}
                  </p>
                  {row.tasks?.boards?.name && (
                    <p className="mt-0.5 text-xs text-muted">
                      {row.tasks.boards.name}
                    </p>
                  )}
                </div>
                <time
                  dateTime={row.completed_at}
                  className="shrink-0 text-xs text-muted"
                >
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(row.completed_at))}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
