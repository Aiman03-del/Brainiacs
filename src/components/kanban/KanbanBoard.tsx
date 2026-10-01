"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import Column from "./Column";
import { TaskCardBody } from "./TaskCard";
import TaskModal from "./TaskModal";
import type { Column as BoardColumn, Task } from "@/types";
import type { Database } from "@/types/database.types";

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
type ActiveDrag = { type: "task" | "column"; id: string };

interface KanbanBoardProps {
  boardId: string;
  userId: string;
  initialColumns: BoardColumn[];
  initialTasks: Task[];
  initialCompleted: string[];
}

const byPosition = (left: BoardColumn | Task, right: BoardColumn | Task) =>
  left.position - right.position ||
  String(left.created_at).localeCompare(String(right.created_at));

export default function KanbanBoard({
  boardId,
  userId,
  initialColumns,
  initialTasks,
  initialCompleted,
}: KanbanBoardProps) {
  const [supabase] = useState(() => createClient());
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompleted ?? []);
  const [active, setActive] = useState<ActiveDrag | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const draggingRef = useRef<boolean>(false);
  const justDraggedRef = useRef<boolean>(false);
  const dragStartColumnRef = useRef<string | null>(null);
  const snapshotRef = useRef<Task[] | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const sortIfIdle = <T extends BoardColumn | Task>(list: T[]): T[] =>
      draggingRef.current ? list : [...list].sort(byPosition);

    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const incoming = payload.new as unknown as BoardColumn;
          setColumns((previous) =>
            previous.some((column) => column.id === incoming.id)
              ? previous
              : sortIfIdle([...previous, incoming]),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const incoming = payload.new as unknown as BoardColumn;
          setColumns((previous) =>
            sortIfIdle(
              previous.map((column) =>
                column.id === incoming.id
                  ? { ...column, ...incoming }
                  : column,
              ),
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "columns" },
        (payload) => {
          const deletedId = payload.old.id;
          setColumns((previous) =>
            previous.filter((column) => column.id !== deletedId),
          );
          setTasks((previous) =>
            previous.filter((task) => task.column_id !== deletedId),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const incoming = payload.new as unknown as Task;
          setTasks((previous) =>
            previous.some((task) => task.id === incoming.id)
              ? previous
              : sortIfIdle([...previous, incoming]),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const incoming = payload.new as unknown as Task;
          setTasks((previous) =>
            sortIfIdle(
              previous.map((task) =>
                task.id === incoming.id ? { ...task, ...incoming } : task,
              ),
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tasks" },
        (payload) => {
          const deletedId = payload.old.id;
          setTasks((previous) =>
            previous.filter((task) => task.id !== deletedId),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, boardId]);

  const tasksByColumn = useMemo(() => {
    const groupedTasks: Record<string, Task[]> = {};
    columns.forEach((column) => {
      groupedTasks[column.id] = [];
    });
    tasks.forEach((task) => {
      if (groupedTasks[task.column_id]) {
        groupedTasks[task.column_id].push(task);
      }
    });
    return groupedTasks;
  }, [columns, tasks]);

  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;
  const activeTask =
    active?.type === "task"
      ? tasks.find((task) => task.id === active.id)
      : null;
  const activeColumn =
    active?.type === "column"
      ? columns.find((column) => column.id === active.id)
      : null;

  const logActivity = (entity: string, action: string, message: string) => {
    supabase
      .from("activities")
      .insert({ board_id: boardId, user_id: userId, entity, action, message })
      .then(({ error: logError }) => {
        if (logError) console.error("Activity log failed:", logError.message);
      });
  };

  const columnTitle = (columnId: string | null) =>
    columns.find((column) => column.id === columnId)?.title ?? "a column";

  const addColumn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newColumnTitle.trim();
    if (!title) return;
    setError("");

    const position = columns.length
      ? Math.max(...columns.map((column) => column.position)) + 1
      : 0;

    const { data, error: insertError } = await supabase
      .from("columns")
      .insert({ board_id: boardId, title, position })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setColumns((previous) =>
      previous.some((column) => column.id === data.id)
        ? previous
        : [...previous, data].sort(byPosition),
    );
    logActivity("Column", "Add", `New column ${title} added`);
    setNewColumnTitle("");
    setAddingColumn(false);
  };

  const renameColumn = async (columnId: string, title: string) => {
    setError("");
    const oldTitle =
      columns.find((column) => column.id === columnId)?.title ?? title;
    setColumns((previous) =>
      previous.map((column) =>
        column.id === columnId ? { ...column, title } : column,
      ),
    );

    const { error: updateError } = await supabase
      .from("columns")
      .update({ title })
      .eq("id", columnId);

    if (updateError) {
      setError(updateError.message);
      setColumns((previous) =>
        previous.map((column) =>
          column.id === columnId ? { ...column, title: oldTitle } : column,
        ),
      );
      return;
    }
    logActivity("ColumnName", "Update", `Column name is updated to ${title}`);
  };

  const deleteColumn = async (columnId: string) => {
    const column = columns.find((entry) => entry.id === columnId);
    if (!column) return;
    if (!window.confirm(`Delete column "${column.title}" and all its tasks?`)) {
      return;
    }
    setError("");

    const { error: deleteError } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setColumns((previous) => previous.filter((entry) => entry.id !== columnId));
    setTasks((previous) =>
      previous.filter((task) => task.column_id !== columnId),
    );
    logActivity("Column", "Delete", `Deleted column ${column.title}`);
  };

  const addTask = async (columnId: string, title: string): Promise<boolean> => {
    setError("");
    const columnTasks = tasksByColumn[columnId] ?? [];
    const position = columnTasks.length
      ? Math.max(...columnTasks.map((task) => task.position)) + 1
      : 0;

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({ board_id: boardId, column_id: columnId, title, position })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return false;
    }

    setTasks((previous) =>
      previous.some((task) => task.id === data.id)
        ? previous
        : [...previous, data].sort(byPosition),
    );
    logActivity(
      "Task",
      "Add",
      `Task ${title} added in ${columnTitle(columnId)}`,
    );
    return true;
  };

  const updateTask = async (
    taskId: string,
    patch: TaskUpdate,
  ): Promise<string | null> => {
    const { data, error: updateError } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) return updateError.message;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, ...data } : task,
      ),
    );
    logActivity("Task", "Update", `Task ${data.title} updated`);
    return null;
  };

  const deleteTask = async (taskId: string): Promise<string | null> => {
    const task = tasks.find((entry) => entry.id === taskId);

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) return deleteError.message;

    setTasks((previous) => previous.filter((entry) => entry.id !== taskId));
    logActivity("Task", "Delete", `Task ${task?.title ?? ""} deleted`);
    return null;
  };

  const completeTask = async (taskId: string): Promise<string | null> => {
    const task = tasks.find((entry) => entry.id === taskId);

    const { error: insertError } = await supabase
      .from("completed_tasks")
      .insert({ task_id: taskId, user_id: userId });

    if (insertError) {
      if (insertError.code === "23505") {
        setCompletedIds((previous) =>
          previous.includes(taskId) ? previous : [...previous, taskId],
        );
        return null;
      }
      return insertError.message;
    }

    setCompletedIds((previous) => [...previous, taskId]);
    logActivity("Task", "Done", `Task ${task?.title ?? ""} marked as done`);
    return null;
  };

  const handleOpenTask = (taskId: string) => {
    if (justDraggedRef.current) return;
    setOpenTaskId(taskId);
  };

  const handleDragStart = ({ active: activeItem }: DragStartEvent) => {
    draggingRef.current = true;
    const activeData = activeItem.data.current as
      | { type?: unknown; task?: Task }
      | undefined;
    const type = activeData?.type;
    if (type !== "task" && type !== "column") return;
    setActive({ type, id: String(activeItem.id) });
    snapshotRef.current = tasks;
    if (type === "task" && activeData?.task) {
      dragStartColumnRef.current = activeData.task.column_id;
    }
  };

  const handleDragOver = ({ active: activeItem, over }: DragOverEvent) => {
    if (!over || activeItem.data.current?.type !== "task") return;
    if (activeItem.id === over.id) return;

    const overType = over.data.current?.type;

    setTasks((previous) => {
      const activeIndex = previous.findIndex(
        (task) => task.id === activeItem.id,
      );
      if (activeIndex === -1) return previous;
      const activeTaskItem = previous[activeIndex];

      if (overType === "task") {
        const overIndex = previous.findIndex((task) => task.id === over.id);
        if (overIndex === -1) return previous;
        const overTaskItem = previous[overIndex];

        if (activeTaskItem.column_id !== overTaskItem.column_id) {
          const nextTasks = [...previous];
          nextTasks[activeIndex] = {
            ...activeTaskItem,
            column_id: overTaskItem.column_id,
          };
          return arrayMove(nextTasks, activeIndex, overIndex);
        }
        return previous;
      }

      if (overType === "column" && activeTaskItem.column_id !== over.id) {
        const nextTasks = [...previous];
        nextTasks[activeIndex] = {
          ...activeTaskItem,
          column_id: String(over.id),
        };
        return arrayMove(nextTasks, activeIndex, nextTasks.length - 1);
      }

      return previous;
    });
  };

  const handleDragCancel = () => {
    draggingRef.current = false;
    setActive(null);
    if (snapshotRef.current) setTasks(snapshotRef.current);
    snapshotRef.current = null;
  };

  const handleDragEnd = async ({ active: activeItem, over }: DragEndEvent) => {
    draggingRef.current = false;
    justDraggedRef.current = true;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 150);
    setActive(null);

    const activeData = activeItem.data.current as
      | { type?: unknown; task?: Task }
      | undefined;
    const type = activeData?.type;

    if (type === "column") {
      if (!over) return;
      const overData = over.data.current as
        | { type?: unknown; task?: Task }
        | undefined;
      const overType = overData?.type;
      const overColumnId =
        overType === "task"
          ? overData?.task?.column_id ?? String(over.id)
          : String(over.id);

      const oldIndex = columns.findIndex(
        (column) => column.id === activeItem.id,
      );
      const newIndex = columns.findIndex(
        (column) => column.id === overColumnId,
      );
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const nextColumns = arrayMove(columns, oldIndex, newIndex).map(
        (column, index) => ({ ...column, position: index }),
      );
      setColumns(nextColumns);

      const { error: rpcError } = await supabase.rpc("reorder_columns", {
        items: nextColumns.map((column) => ({
          id: column.id,
          position: column.position,
        })),
      });
      if (rpcError)
        setError(`Failed to save column order: ${rpcError.message}`);
      return;
    }

    if (type === "task") {
      let nextTasks = tasks;

      if (
        over &&
        over.data.current?.type === "task" &&
        over.id !== activeItem.id
      ) {
        const fromIndex = tasks.findIndex((task) => task.id === activeItem.id);
        const toIndex = tasks.findIndex((task) => task.id === over.id);
        if (
          fromIndex !== -1 &&
          toIndex !== -1 &&
          tasks[fromIndex].column_id === tasks[toIndex].column_id
        ) {
          nextTasks = arrayMove(tasks, fromIndex, toIndex);
        }
      }

      const movedTask = nextTasks.find((task) => task.id === activeItem.id);
      if (!movedTask) return;

      const startColumnId = dragStartColumnRef.current;
      if (startColumnId === null) return;
      const affectedColumns = new Set([startColumnId, movedTask.column_id]);
      const items: { id: string; column_id: string; position: number }[] = [];
      const positions: Record<string, number> = {};

      affectedColumns.forEach((columnId) => {
        nextTasks
          .filter((task) => task.column_id === columnId)
          .forEach((task, index) => {
            items.push({ id: task.id, column_id: columnId, position: index });
            positions[task.id] = index;
          });
      });

      setTasks(
        nextTasks.map((task) =>
          task.id in positions
            ? { ...task, position: positions[task.id] }
            : task,
        ),
      );

      const { error: rpcError } = await supabase.rpc("reorder_tasks", {
        items,
      });
      if (rpcError) {
        setError(`Failed to save task order: ${rpcError.message}`);
        return;
      }

      if (startColumnId !== movedTask.column_id) {
        logActivity(
          "Task",
          "Move",
          `Task ${movedTask.title} moved from ${columnTitle(
            startColumnId,
          )} to ${columnTitle(movedTask.column_id)}`,
        );
      }
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <DndContext
        id="kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={columns.map((column) => column.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] ?? []}
                onRename={renameColumn}
                onDelete={deleteColumn}
                onAddTask={addTask}
                onOpenTask={handleOpenTask}
              />
            ))}
          </SortableContext>

          <div className="w-72 shrink-0">
            {addingColumn ? (
              <form
                onSubmit={addColumn}
                className="space-y-2 rounded-2xl border bg-surface-muted p-3"
              >
                <input
                  autoFocus
                  value={newColumnTitle}
                  onChange={(event) => setNewColumnTitle(event.target.value)}
                  placeholder="Column title"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Add column
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingColumn(false);
                      setNewColumnTitle("");
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
                onClick={() => setAddingColumn(true)}
                className="w-full rounded-2xl border border-dashed border-border px-4 py-3 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground"
              >
                + Add column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCardBody task={activeTask} dragging />
          ) : activeColumn ? (
            <div className="w-72 rounded-2xl border bg-surface-muted p-3 text-sm font-semibold text-foreground shadow-lg">
              {activeColumn.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTask && (
        <TaskModal
          key={openTask.id}
          task={openTask}
          onSave={(patch) => updateTask(openTask.id, patch)}
          onDelete={() => deleteTask(openTask.id)}
          completed={completedIds.includes(openTask.id)}
          onComplete={() => completeTask(openTask.id)}
          onClose={() => setOpenTaskId(null)}
        />
      )}
    </div>
  );
}
