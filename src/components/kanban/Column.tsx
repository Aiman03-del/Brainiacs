"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import TaskCard from "./TaskCard";
import type { Column as BoardColumn, Task } from "@/types";

interface ColumnProps {
  column: BoardColumn;
  tasks: Task[];
  onRename: (columnId: string, title: string) => Promise<void>;
  onDelete: (columnId: string) => Promise<void>;
  onAddTask: (columnId: string, title: string) => Promise<boolean>;
  onOpenTask: (taskId: string) => void;
}

export default function Column({
  column,
  tasks,
  onRename,
  onDelete,
  onAddTask,
  onOpenTask,
}: ColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [adding, setAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const startEdit = () => {
    setTitle(column.title);
    setEditing(true);
  };

  const saveTitle = () => {
    const cleanTitle = title.trim();
    setEditing(false);
    if (cleanTitle && cleanTitle !== column.title) {
      void onRename(column.id, cleanTitle);
    }
  };

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) return;

    const success = await onAddTask(column.id, cleanTitle);
    if (success) {
      setTaskTitle("");
      setAdding(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface-muted p-3"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Drag ${column.title} column`}
          title="Drag column"
          {...attributes}
          {...listeners}
          className="inline-flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </button>

        {editing ? (
          <input
            autoFocus
            aria-label={`Rename ${column.title} column`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setTitle(column.title);
                setEditing(false);
              }
            }}
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm font-semibold text-foreground"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            title="Rename column"
            className="min-h-11 min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm font-semibold text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
          >
            {column.title}
          </button>
        )}

        <span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted">
          {tasks.length}
        </span>
        <button
          type="button"
          aria-label={`Delete ${column.title} column`}
          title="Delete column"
          onClick={() => onDelete(column.id)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-danger"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-8 flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <form onSubmit={handleAddTask} className="mt-3 space-y-2">
          <label htmlFor={`new-task-${column.id}`} className="sr-only">New task title</label>
          <input
            id={`new-task-${column.id}`}
            autoFocus
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Task title"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={!taskTitle.trim()} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
              <Plus aria-hidden="true" className="h-4 w-4" />Add task
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setTaskTitle("");
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-hover"
            >
              <X aria-hidden="true" className="h-4 w-4" />Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />Add task
        </button>
      )}
    </div>
  );
}