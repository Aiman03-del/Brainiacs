"use client";

import { useState } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

export default function Column({
  column,
  tasks,
  onRename,
  onDelete,
  onAddTask,
  onOpenTask,
}) {
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
      onRename(column.id, cleanTitle);
    }
  };

  const handleAddTask = async (event) => {
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
      className="flex w-72 shrink-0 flex-col rounded-2xl border bg-surface-muted p-3"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Drag column"
          {...attributes}
          {...listeners}
          className="cursor-grab px-1 text-muted hover:text-foreground"
        >
          &#8942;&#8942;
        </button>

        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") setEditing(false);
            }}
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm font-semibold text-foreground"
          />
        ) : (
          <h3
            onClick={startEdit}
            className="min-w-0 flex-1 cursor-text truncate text-sm font-semibold text-foreground"
            title="Click to rename"
          >
            {column.title}
          </h3>
        )}

        <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
          {tasks.length}
        </span>

        <button
          type="button"
          aria-label="Delete column"
          onClick={() => onDelete(column.id)}
          className="rounded-md px-1.5 text-muted hover:bg-danger-soft hover:text-danger"
        >
          &times;
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
          <input
            autoFocus
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Task title"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setTaskTitle("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 rounded-lg px-2 py-1.5 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
        >
          + Add task
        </button>
      )}
    </div>
  );
}
