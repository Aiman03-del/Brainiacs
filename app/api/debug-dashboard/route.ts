import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { ACTIVITY_SELECT } from "@/components/activity/constants";
import { createClient } from "@/lib/supabase/server";

// Temporary diagnostic route. Delete this folder after the problem is found.

type QueryResult = PromiseLike<{ error: PostgrestError | null }>;

function diagnosticError(error: PostgrestError) {
  console.error("Dashboard diagnostic query failed:", {
    code: error.code,
    message: error.message,
  });
  return {
    code: error.code,
    message: "Query failed.",
    details: null,
    hint: null,
  };
}

async function check(query: QueryResult) {
  const { error } = await query;
  if (!error) return "OK";
  return diagnosticError(error);
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Log in first" }, { status: 401 });
  }

  const membershipsQuery = supabase
    .from("board_members")
    .select("role, boards(id, name, theme)")
    .eq("user_id", user.id);

  const memberships = await membershipsQuery;
  const boardIds = (memberships.data ?? [])
    .map((membership) => membership.boards?.id)
    .filter((id): id is string => Boolean(id));

  const results: Record<string, unknown> = {
    profiles: await check(
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle(),
    ),
    board_members_with_boards: memberships.error
      ? diagnosticError(memberships.error)
      : "OK",
  };

  if (boardIds.length === 0) {
    results.note =
      "You are not a member of any board, so the dashboard skips the remaining queries.";
  } else {
    results.activities = await check(
      supabase
        .from("activities")
        .select(ACTIVITY_SELECT, { count: "exact" })
        .in("board_id", boardIds)
        .order("created_at", { ascending: false })
        .limit(6),
    );
    results.messages_with_profiles = await check(
      supabase
        .from("messages")
        .select("id, board_id, text, created_at, profiles(display_name)")
        .in("board_id", boardIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30),
    );
    results.tasks_with_columns = await check(
      supabase
        .from("tasks")
        .select("id, board_id, column_id, title, due_at, columns(title)", {
          count: "exact",
        })
        .in("board_id", boardIds)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(60),
    );
    results.completed_tasks = await check(
      supabase
        .from("completed_tasks")
        .select("task_id", { count: "exact" })
        .eq("user_id", user.id),
    );
    results.board_members_with_profiles = await check(
      supabase
        .from("board_members")
        .select("board_id, user_id, profiles(display_name, photo_url)")
        .in("board_id", boardIds),
    );
  }

  return NextResponse.json({ boardCount: boardIds.length, results }, { status: 200 });
}