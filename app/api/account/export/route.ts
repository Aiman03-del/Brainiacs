import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROW_LIMIT = 1000;

export async function GET(): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const [
    profile,
    settings,
    memberships,
    messages,
    completedTasks,
    activities,
    polls,
    pollVotes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, photo_url, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_settings")
      .select("notify_invites, notify_task_reminders, allow_invites")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("board_members")
      .select("role, joined_at, boards(id, name, description, visibility, created_at)")
      .eq("user_id", user.id),
    supabase
      .from("messages")
      .select("id, board_id, text, attachments, created_at, edited_at")
      .eq("sender_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("completed_tasks")
      .select("completed_at, tasks(title, boards(name))")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("activities")
      .select("entity, action, message, created_at, board_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("polls")
      .select("id, board_id, question, options, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    supabase
      .from("poll_votes")
      .select("poll_id, option_index, created_at")
      .eq("user_id", user.id)
      .limit(ROW_LIMIT),
  ]);

  const failedQueries = Object.entries({
    profile: profile.error,
    settings: settings.error,
    memberships: memberships.error,
    messages: messages.error,
    completedTasks: completedTasks.error,
    activities: activities.error,
    polls: polls.error,
    pollVotes: pollVotes.error,
  }).flatMap(([query, error]) =>
    error ? [{ query, code: error.code }] : [],
  );

  if (failedQueries.length > 0) {
    console.error("Account export query failures:", failedQueries);
    return NextResponse.json(
      { error: "Unable to prepare your export. Please try again." },
      { status: 500 },
    );
  }

  const payload = {
    exported_at: new Date().toISOString(),
    note: `Lists are limited to the ${ROW_LIMIT} most recent items per category.`,
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      sign_in_methods: user.identities?.map((identity) => identity.provider) ?? [],
    },
    profile: profile.data,
    settings: settings.data,
    boards: memberships.data,
    messages: messages.data,
    completed_tasks: completedTasks.data,
    activities: activities.data,
    polls: polls.data,
    poll_votes: pollVotes.data,
  };

  const day = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="brainiacs-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
