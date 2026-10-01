"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types";

interface TaskCardBodyProps {
  task: Task;
  dragging?: boolean;
}

interface TaskCardProps {
  task: Task;
  onOpen: (taskId: string) => void;
}

export function TaskCardBody({
  task,
  dragging = false,
}: TaskCardBodyProps) {
  return (
    <div
      className={`rounded-xl border bg-surface p-3 ${
        dragging ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <p className="wrap-break-word text-sm font-medium text-foreground">
        {task.title}
      </p>

      {task.description && (
        <p className="mt-1 line-clamp-2 wrap-break-word text-xs text-muted">
          {task.description}
        </p>
      )}

      {task.due_at && (
        <p className="mt-2 text-xs text-muted" suppressHydrationWarning>
          Due{" "}
          {new Date(task.due_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

export default function TaskCard({ task, onOpen }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
      className="cursor-grab"
    >
      <TaskCardBody task={task} />
    </div>
  );
}
