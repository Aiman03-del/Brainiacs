"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityBoardSummary, ActivityFeedRow } from "@/types";
import { ACTIVITY_PAGE_SIZE, ACTIVITY_SELECT } from "./constants";

function badgeClass(action: string): string {
  if (action === "Delete") return "bg-danger-soft text-danger";
  if (action === "Add" || action === "Done") {
    return "bg-surface-muted text-success";
  }
  return "bg-surface-muted text-muted";
}

interface ActivityFeedProps {
  boards: ActivityBoardSummary[];
  initialRows: ActivityFeedRow[];
  userId: string;
}

export default function ActivityFeed({
  boards,
  initialRows,
  userId,
}: ActivityFeedProps) {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<ActivityFeedRow[]>(initialRows);
  const [boardId, setBoardId] = useState("all");
  const [hasMore, setHasMore] = useState(
    initialRows.length >= ACTIVITY_PAGE_SIZE,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filterRef = useRef<string>("all");
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const channel = supabase
      .channel(`activity-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        async (payload) => {
          const { data } = await supabase
            .from("activities")
            .select(ACTIVITY_SELECT)
            .eq("id", payload.new.id)
            .maybeSingle();

          if (!data) return;
          if (
            filterRef.current !== "all" &&
            data.board_id !== filterRef.current
          ) {
            return;
          }
          setRows((previous) =>
            previous.some((row) => row.id === data.id)
              ? previous
              : [data, ...previous],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const fetchPage = async (selectedBoard: string, before: string | null) => {
    let query = supabase
      .from("activities")
      .select(ACTIVITY_SELECT)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_PAGE_SIZE);

    if (selectedBoard !== "all") query = query.eq("board_id", selectedBoard);
    if (before) query = query.lt("created_at", before);

    return query;
  };

  const handleBoardChange = async (value: string) => {
    setBoardId(value);
    filterRef.current = value;
    setError("");
    setLoading(true);

    const requestId = ++requestRef.current;
    const { data, error: fetchError } = await fetchPage(value, null);

    if (requestId !== requestRef.current) return;
    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setRows(data ?? []);
    setHasMore((data ?? []).length >= ACTIVITY_PAGE_SIZE);
  };

  const loadMore = async () => {
    if (!rows.length || loading || !hasMore) return;
    setError("");
    setLoading(true);

    const requestId = ++requestRef.current;
    const { data, error: fetchError } = await fetchPage(
      boardId,
      rows[rows.length - 1].created_at,
    );

    if (requestId !== requestRef.current) return;
    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setRows((previous) => {
      const ids = new Set(previous.map((row) => row.id));
      return [...previous, ...(data ?? []).filter((row) => !ids.has(row.id))];
    });
    setHasMore((data ?? []).length >= ACTIVITY_PAGE_SIZE);
  };

  return (
    <div>
      <div className="mb-4">
        <select
          value={boardId}
          onChange={(event) => handleBoardChange(event.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All boards</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      {rows.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
          No activity yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start gap-3 rounded-xl border bg-surface p-3"
            >
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(
                  row.action,
                )}`}
              >
                {row.entity} &middot; {row.action}
              </span>

              <div className="min-w-0 flex-1">
                <p className="wrap-break-word text-sm text-foreground">
                  {row.message}
                </p>
                <p
                  className="mt-0.5 text-xs text-muted"
                  suppressHydrationWarning
                >
                  {row.profiles?.display_name ?? "Someone"}
                  {row.boards?.name ? ` in ${row.boards.name}` : ""}
                  {" · "}
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <p className="mt-4 text-center text-sm text-muted">Loading...</p>
      )}

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
