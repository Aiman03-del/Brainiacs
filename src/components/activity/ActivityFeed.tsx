"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ListFilter,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { ActivityBoardSummary, ActivityFeedRow } from "@/types";
import { ACTIVITY_PAGE_SIZE, ACTIVITY_SELECT } from "./constants";

interface ActivityFeedProps {
  boards: ActivityBoardSummary[];
  initialRows: ActivityFeedRow[];
  initialError?: boolean;
  userId: string;
}

function getActivityIcon(entity: string, action: string): LucideIcon {
  if (action === "Delete") return Trash2;
  if (action === "Update") return Pencil;
  if (action === "Done") return CheckCircle2;
  if (action === "Move") return ArrowLeftRight;
  if (action === "Add" && entity === "Board") return Building2;
  if (action === "Add") return Plus;
  if (entity === "Task") return ClipboardCheck;
  return Activity;
}

function getDateGroup(createdAt: string): "Today" | "Yesterday" | "Earlier" {
  const eventDate = new Date(createdAt);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfEvent = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  );
  const daysAgo = Math.round(
    (startOfToday.getTime() - startOfEvent.getTime()) / 86_400_000,
  );

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return "Earlier";
}

function formatTimestamp(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export function ActivitySkeleton() {
  return (
    <ul aria-label="Loading activity" className="divide-y divide-border">
      {Array.from({ length: 5 }, (_, index) => (
        <li key={index} className="flex animate-pulse items-start gap-3 py-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-surface-muted" />
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
            <Activity aria-hidden="true" className="h-4 w-4 text-muted" />
          </div>
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded bg-surface-muted" />
            <div className="h-3 w-2/5 rounded bg-surface-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ActivityFeed({
  boards,
  initialRows,
  initialError = false,
  userId,
}: ActivityFeedProps) {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<ActivityFeedRow[]>(initialRows);
  const [boardId, setBoardId] = useState("all");
  const [hasMore, setHasMore] = useState(
    initialRows.length >= ACTIVITY_PAGE_SIZE,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

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

  const refresh = async () => {
    setError(false);
    setLoading(true);
    const requestId = ++requestRef.current;

    try {
      const { data, error: fetchError } = await fetchPage(boardId, null);
      if (requestId !== requestRef.current) return;
      if (fetchError) throw fetchError;
      setRows(data ?? []);
      setHasMore((data ?? []).length >= ACTIVITY_PAGE_SIZE);
    } catch {
      if (requestId === requestRef.current) setError(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const handleBoardChange = async (value: string) => {
    setBoardId(value);
    filterRef.current = value;
    setError(false);
    setLoading(true);

    const requestId = ++requestRef.current;
    try {
      const { data, error: fetchError } = await fetchPage(value, null);
      if (requestId !== requestRef.current) return;
      if (fetchError) throw fetchError;
      setRows(data ?? []);
      setHasMore((data ?? []).length >= ACTIVITY_PAGE_SIZE);
    } catch {
      if (requestId === requestRef.current) setError(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!rows.length || loading || !hasMore) return;
    setError(false);
    setLoading(true);

    const requestId = ++requestRef.current;
    try {
      const { data, error: fetchError } = await fetchPage(
        boardId,
        rows[rows.length - 1].created_at,
      );
      if (requestId !== requestRef.current) return;
      if (fetchError) throw fetchError;

      setRows((previous) => {
        const ids = new Set(previous.map((row) => row.id));
        return [...previous, ...(data ?? []).filter((row) => !ids.has(row.id))];
      });
      setHasMore((data ?? []).length >= ACTIVITY_PAGE_SIZE);
    } catch {
      if (requestId === requestRef.current) setError(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const groups = rows.reduce<Record<string, ActivityFeedRow[]>>((result, row) => {
    const group = getDateGroup(row.created_at);
    (result[group] ??= []).push(row);
    return result;
  }, {});

  return (
    <div>
      {boards.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <ListFilter aria-hidden="true" className="h-4 w-4 text-muted" />
          <label htmlFor="activity-board-filter" className="sr-only">
            Filter activity by board
          </label>
          <select
            id="activity-board-filter"
            value={boardId}
            onChange={(event) => handleBoardChange(event.target.value)}
            className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="all">All boards</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <p className="text-sm text-foreground">Unable to load activity.</p>
          <button
            type="button"
            onClick={refresh}
            className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try again
          </button>
        </div>
      )}

      {loading && rows.length === 0 ? (
        <ActivitySkeleton />
      ) : rows.length === 0 && !error ? (
        <div className="border-y border-border py-12 text-center">
          <Activity aria-hidden="true" className="mx-auto h-6 w-6 text-muted" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">
            No recent activity
          </h2>
          <p className="mt-1 text-sm text-muted">
            Activity from your workspace will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {(["Today", "Yesterday", "Earlier"] as const).map((groupName) => {
            const groupRows = groups[groupName];
            if (!groupRows?.length) return null;

            return (
              <section key={groupName} aria-labelledby={`activity-${groupName}`}>
                <h2
                  id={`activity-${groupName}`}
                  className="pb-1 pt-5 text-xs font-semibold uppercase text-muted first:pt-3"
                >
                  {groupName}
                </h2>
                <ul className="divide-y divide-border">
                  {groupRows.map((row) => {
                    const Icon = getActivityIcon(row.entity, row.action);
                    const name = row.profiles?.display_name ?? "Someone";

                    return (
                      <li key={row.id} className="flex items-start gap-3 py-4">
                        <Avatar name={name} size={40} />
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="wrap-break-word text-sm leading-5 text-foreground">
                            {row.message}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                            <span className="font-medium text-foreground">
                              {name}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{row.entity} · {row.action}</span>
                            {row.boards?.name && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{row.boards.name}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <time dateTime={row.created_at} suppressHydrationWarning>
                              {formatTimestamp(row.created_at)}
                            </time>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {loading && rows.length > 0 && (
        <div aria-label="Loading more activity" className="py-4">
          <ActivitySkeleton />
        </div>
      )}

      {hasMore && !loading && rows.length > 0 && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="min-h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
