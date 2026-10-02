"use client";

import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Check, LoaderCircle, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
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
  const pad = (part: number) => String(part).padStart(2, "0");
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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      if (message) setError(message);
      else onClose();
    } catch {
      setError("Unable to save this task. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setBusy(true);
    try {
      const message = await onDelete();
      if (message) setError(message);
      else onClose();
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

  const handleDeleteDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!busy) setConfirmDelete(false);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not([disabled])",
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <>
      <Modal
        open
        onClose={() => {
          if (busy) return;
          if (confirmDelete) setConfirmDelete(false);
          else onClose();
        }}
        title="Edit task"
        size="md"
        className="sm:mb-0"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-foreground">Title</label>
            <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required className={fieldClass} />
          </div>

          <div>
            <label htmlFor="task-description" className="mb-1 block text-sm font-medium text-foreground">Description</label>
            <textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Add more details..." className={fieldClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-start" className="mb-1 block text-sm font-medium text-foreground">Start</label>
              <input id="task-start" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="task-due" className="mb-1 block text-sm font-medium text-foreground">Due</label>
              <input id="task-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={fieldClass} />
            </div>
          </div>

          <div>
            <label htmlFor="task-reminder" className="mb-1 block text-sm font-medium text-foreground">Reminder</label>
            <select id="task-reminder" value={reminder} onChange={(event) => setReminder(event.target.value)} className={fieldClass}>
              <option value="">No reminder</option>
              <option value="15m">15 minutes before</option>
              <option value="1h">1 hour before</option>
              <option value="1d">1 day before</option>
            </select>
          </div>

          <div className="rounded-lg bg-surface-muted p-3">
            {completed ? (
              <p className="text-sm font-medium text-success">You completed this task (+1 point).</p>
            ) : (
              <button type="button" onClick={handleComplete} disabled={busy} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-success px-3 text-sm font-medium text-success hover:bg-surface-hover disabled:opacity-60 sm:min-h-9">
                {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
                Mark as done (+1 point)
              </button>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-danger px-3 text-sm text-danger hover:bg-danger-soft disabled:opacity-60 sm:min-h-10">
              <Trash2 aria-hidden="true" className="h-4 w-4" />Delete
            </button>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60 sm:min-h-10">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60 sm:min-h-10">
                {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {confirmDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          aria-describedby="delete-task-description"
          onKeyDown={handleDeleteDialogKeyDown}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-overlay p-4"
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl">
            <h3 id="delete-task-title" className="text-base font-semibold text-foreground">Delete this task?</h3>
            <p id="delete-task-description" className="mt-2 text-sm text-muted">This task will be removed from its board.</p>
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" autoFocus disabled={busy} onClick={() => setConfirmDelete(false)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60 sm:min-h-10"><X aria-hidden="true" className="h-4 w-4" />Cancel</button>
              <button type="button" disabled={busy} onClick={handleDelete} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-danger px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:min-h-10">
                {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}