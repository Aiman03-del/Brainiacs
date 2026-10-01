"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Database } from "@/types/database.types";
import type { Task } from "@/types";

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

interface TaskModalProps {
  task: Task;
  completed: boolean;
  onSave: (patch: TaskUpdate) => Promise<string | null>;
  onDelete: () => Promise<string | null>;
  onComplete: () => Promise<string | null>;
  onClose: () => void;
}

function toLocalInput(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskModal({
  task,
  completed,
  onSave,
  onDelete,
  onComplete,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [startAt, setStartAt] = useState(toLocalInput(task.start_at));
  const [dueAt, setDueAt] = useState(toLocalInput(task.due_at));
  const [reminder, setReminder] = useState(task.reminder ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }
    if (startAt && dueAt && new Date(dueAt) < new Date(startAt)) {
      setError("Due date must be after the start date.");
      return;
    }

    setBusy(true);
    try {
      const message = await onSave({
        title: cleanTitle,
        description: description.trim() || null,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        reminder: reminder || null,
      });

      if (message) {
        setError(message);
      } else {
        onClose();
      }
    } catch {
      setError("Unable to save this task. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;

    setBusy(true);
    try {
      const message = await onDelete();
      if (message) {
        setError(message);
      } else {
        onClose();
      }
    } catch {
      setError("Unable to delete this task. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setError("");
    setBusy(true);
    try {
      const message = await onComplete();
      if (message) setError(message);
    } catch {
      setError("Unable to mark this task as done. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-foreground">Edit task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Add more details..."
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Start
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Due
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Reminder
            </label>
            <select
              value={reminder}
              onChange={(event) => setReminder(event.target.value)}
              className={fieldClass}
            >
              <option value="">No reminder</option>
              <option value="15m">15 minutes before</option>
              <option value="1h">1 hour before</option>
              <option value="1d">1 day before</option>
            </select>
          </div>

          <div className="rounded-lg bg-surface-muted p-3">
            {completed ? (
              <p className="text-sm font-medium text-success">
                You completed this task (+1 point).
              </p>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={busy}
                className="rounded-lg border border-success px-3 py-1.5 text-sm font-medium text-success hover:bg-surface-hover disabled:opacity-60"
              >
                Mark as done (+1 point)
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-lg border border-danger px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
            >
              Delete
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
