"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { Board } from "@/types";
import type { ActionResult as BoardActionResult } from "../../../app/dashboard/boards/actions";

const THEMES = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

interface BoardFormModalProps {
  title: string;
  submitLabel: string;
  initial?: Pick<Board, "name" | "description" | "visibility" | "theme">;
  onSubmit: (formData: FormData) => Promise<BoardActionResult>;
  onClose: () => void;
}

export default function BoardFormModal({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: BoardFormModalProps) {
  const [theme, setTheme] = useState(initial?.theme ?? THEMES[0]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    formData.set("theme", theme);

    startTransition(async () => {
      try {
        const result = await onSubmit(formData);
        if ("error" in result) {
          setError(result.error);
        } else {
          onClose();
        }
      } catch {
        setError("Unable to save this board. Please try again.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-form-title"
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 id="board-form-title" className="mb-4 text-xl font-bold">
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="board-name"
              className="mb-1 block text-sm font-medium"
            >
              Board name
            </label>
            <input
              id="board-name"
              name="name"
              type="text"
              required
              defaultValue={initial?.name ?? ""}
              placeholder="e.g. Website redesign"
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="board-description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="board-description"
              name="description"
              rows={3}
              defaultValue={initial?.description ?? ""}
              placeholder="What is this board about?"
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="board-visibility"
              className="mb-1 block text-sm font-medium"
            >
              Visibility
            </label>
            <select
              id="board-visibility"
              name="visibility"
              defaultValue={initial?.visibility ?? "Public"}
              className="w-full rounded-lg border border-border px-3 py-2"
            >
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <fieldset>
            <legend className="mb-1 block text-sm font-medium">
              Theme color
            </legend>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTheme(color)}
                  aria-label={`Select color ${color}`}
                  aria-pressed={theme === color}
                  style={{ backgroundColor: color }}
                  className={`h-8 w-8 rounded-full border-2 ${
                    theme === color ? "border-foreground" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-hover disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
