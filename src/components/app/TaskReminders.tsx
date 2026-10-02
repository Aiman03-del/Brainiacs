"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface TaskRemindersProps {
  userId: string;
  enabled: boolean;
}

interface ReminderTask {
  id: string;
  board_id: string;
  title: string;
  due_at: string;
  reminder: string;
}

const OFFSETS_MS: Record<string, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};
const CHECK_INTERVAL_MS = 30 * 1000;
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;
const STORAGE_PREFIX = "brainiacs-reminded-";
const MAX_STORED_KEYS = 200;

function readReminded(userId: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + userId);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeReminded(userId: string, reminded: Set<string>): void {
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + userId,
      JSON.stringify(Array.from(reminded).slice(-MAX_STORED_KEYS)),
    );
  } catch {
    // Storage can be unavailable; reminders may repeat after a reload.
  }
}

export default function TaskReminders({ userId, enabled }: TaskRemindersProps) {
  const router = useRouter();
  const tasksRef = useRef<ReminderTask[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let cancelled = false;

    const check = () => {
      const now = Date.now();
      const reminded = readReminded(userId);
      let changed = false;

      for (const task of tasksRef.current) {
        const offset = OFFSETS_MS[task.reminder];
        if (offset === undefined) continue;

        const due = new Date(task.due_at).getTime();
        const key = `${task.id}:${task.due_at}:${task.reminder}`;
        if (now < due - offset || now >= due || reminded.has(key)) continue;

        reminded.add(key);
        changed = true;

        const dueLabel = new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(task.due_at));

        toast.info(task.title, {
          description: `Due ${dueLabel}`,
          duration: 15000,
          action: {
            label: "Open board",
            onClick: () => router.push(`/dashboard/boards/${task.board_id}`),
          },
        });
      }

      if (changed) writeReminded(userId, reminded);
    };

    const load = async () => {
      try {
        const { data: memberships } = await supabase
          .from("board_members")
          .select("board_id")
          .eq("user_id", userId);

        const boardIds = (memberships ?? []).map((member) => member.board_id);
        if (cancelled) return;
        if (boardIds.length === 0) {
          tasksRef.current = [];
          return;
        }

        const [tasksResult, doneResult] = await Promise.all([
          supabase
            .from("tasks")
            .select("id, board_id, title, due_at, reminder")
            .in("board_id", boardIds)
            .not("reminder", "is", null)
            .not("due_at", "is", null)
            .gt("due_at", new Date().toISOString()),
          supabase.from("completed_tasks").select("task_id").eq("user_id", userId),
        ]);

        if (cancelled || tasksResult.error) return;

        const done = new Set((doneResult.data ?? []).map((row) => row.task_id));
        tasksRef.current = (tasksResult.data ?? []).flatMap((task) =>
          task.due_at && task.reminder && !done.has(task.id)
            ? [
                {
                  id: task.id,
                  board_id: task.board_id,
                  title: task.title,
                  due_at: task.due_at,
                  reminder: task.reminder,
                },
              ]
            : [],
        );
        check();
      } catch {
        // Reminders are best effort; the next refetch will try again.
      }
    };

    load();
    const checkTimer = setInterval(check, CHECK_INTERVAL_MS);
    const loadTimer = setInterval(load, REFETCH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(checkTimer);
      clearInterval(loadTimer);
    };
  }, [enabled, userId, router]);

  return null;
}
