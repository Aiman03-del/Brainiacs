"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CircleDot,
  ListFilter,
  Plus,
  Search,
  X,
} from "lucide-react";

export interface TaskOverviewRecord {
  id: string;
  boardId: string;
  boardName: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  createdAt: string;
  completedByCurrentUser: boolean;
}

interface TaskWorkspaceProps {
  tasks: TaskOverviewRecord[];
  boards: { id: string; name: string }[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(value: string | null): boolean {
  if (!value) return false;
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export default function TaskWorkspace({ tasks, boards }: TaskWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [completion, setCompletion] = useState("open");
  const [sort, setSort] = useState("due");
  const statuses = useMemo(
    () => [...new Set(tasks.map((task) => task.status))].sort((a, b) => a.localeCompare(b)),
    [tasks],
  );
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tasks
      .filter((task) => {
        if (selectedBoard !== "all" && task.boardId !== selectedBoard) return false;
        if (selectedStatus !== "all" && task.status !== selectedStatus) return false;
        if (completion === "open" && task.completedByCurrentUser) return false;
        if (completion === "completed" && !task.completedByCurrentUser) return false;
        if (
          normalizedQuery &&
          !`${task.title} ${task.description ?? ""} ${task.boardName}`
            .toLocaleLowerCase()
            .includes(normalizedQuery)
        ) return false;
        return true;
      })
      .sort((left, right) => {
        if (sort === "created") return right.createdAt.localeCompare(left.createdAt);
        if (!left.dueAt) return right.dueAt ? 1 : 0;
        if (!right.dueAt) return -1;
        return left.dueAt.localeCompare(right.dueAt);
      });
  }, [tasks, query, selectedBoard, selectedStatus, completion, sort]);

  const openCount = tasks.filter((task) => !task.completedByCurrentUser).length;
  const completedCount = tasks.length - openCount;
  const createHref = boards[0] ? `/dashboard/boards/${boards[0].id}` : "/dashboard/boards";

  const clearFilters = () => {
    setQuery("");
    setSelectedBoard("all");
    setSelectedStatus("all");
    setCompletion("open");
    setSort("due");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Work across your boards</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tasks</h1>
          <p className="mt-2 text-sm text-muted">Plan, organize, and track your team&apos;s work.</p>
        </div>
        <Link
          href={createHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {boards.length ? "Create Task" : "Create a board"}
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Task overview">
        <OverviewMetric label="Tasks across boards" value={tasks.length} icon={<ClipboardCheck aria-hidden="true" className="h-4 w-4" />} />
        <OverviewMetric label="Open for you" value={openCount} icon={<CircleDot aria-hidden="true" className="h-4 w-4" />} />
        <OverviewMetric label="Completed by you" value={completedCount} icon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />} />
      </section>

      <section aria-label="Task filters" className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border px-3 sm:min-w-56">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Search tasks</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </label>

        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3">
          <ListFilter aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Filter by board</span>
          <select value={selectedBoard} onChange={(event) => setSelectedBoard(event.target.value)} className="min-w-0 bg-transparent text-sm text-foreground outline-none">
            <option value="all">All boards</option>
            {boards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
          </select>
        </label>

        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3">
          <CircleDot aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Filter by status</span>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="min-w-0 bg-transparent text-sm text-foreground outline-none">
            <option value="all">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Filter completion</span>
          <select value={completion} onChange={(event) => setCompletion(event.target.value)} className="min-w-0 bg-transparent text-sm text-foreground outline-none">
            <option value="open">Open for you</option>
            <option value="completed">Completed by you</option>
            <option value="all">All tasks</option>
          </select>
        </label>

        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3">
          <ArrowUpDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Sort tasks</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-0 bg-transparent text-sm text-foreground outline-none">
            <option value="due">Due date</option>
            <option value="created">Recently created</option>
          </select>
        </label>
      </section>

      <section aria-labelledby="task-list-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="task-list-title" className="text-base font-semibold text-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          </h2>
          {(query || selectedBoard !== "all" || selectedStatus !== "all" || completion !== "open" || sort !== "due") && (
            <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground">
              <X aria-hidden="true" className="h-4 w-4" />Clear filters
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-5 py-12 text-center">
            <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-muted" />
            <h3 className="mt-3 text-base font-semibold text-foreground">No tasks yet.</h3>
            <h3 className="mt-3 text-base font-semibold text-foreground">{boards.length ? "No tasks yet." : "No boards available."}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">{boards.length ? "Create a task in one of your boards to start tracking work." : "Create or join a board before adding tasks."}</p>
            {boards.length ? (
              <Link href={createHref} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"><Plus aria-hidden="true" className="h-4 w-4" />Create Task</Link>
            ) : (
              <Link href="/dashboard/boards" className="mt-4 text-sm font-medium text-primary hover:underline">Create or join a board</Link>
            )}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center">
            <Search aria-hidden="true" className="h-6 w-6 text-muted" />
            <p className="mt-3 text-sm font-medium text-foreground">No tasks match these filters.</p>
            <button type="button" onClick={clearFilters} className="mt-2 text-sm font-medium text-primary hover:underline">Clear filters</button>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.dueAt) && !task.completedByCurrentUser;
              return (
                <li key={task.id}>
                  <Link href={`/dashboard/boards/${task.boardId}`} className="flex min-w-0 flex-col gap-2 px-3 py-3 transition-colors hover:bg-surface-hover sm:flex-row sm:items-center sm:gap-4 sm:px-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{task.title}</span>
                      {task.description && <span className="mt-1 block truncate text-xs text-muted">{task.description}</span>}
                      <span className="mt-1 block truncate text-xs text-muted">{task.boardName}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-1 text-xs text-muted"><CircleDot aria-hidden="true" className="h-3.5 w-3.5" />{task.status}</span>
                      {task.completedByCurrentUser && <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs text-success"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Done by you</span>}
                      {task.dueAt && <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${overdue ? "bg-danger-soft font-medium text-danger" : "text-muted"}`}><CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />{overdue ? "Overdue" : "Due"} {formatDate(task.dueAt)}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function OverviewMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-lg font-semibold leading-6 text-foreground">{value}</span>
        <span className="block truncate text-xs text-muted sm:text-sm">{label}</span>
      </span>
    </div>
  );
}