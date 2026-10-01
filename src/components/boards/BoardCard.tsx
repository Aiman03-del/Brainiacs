"use client";

import Link from "next/link";
import { Hash, Lock, MessageSquare } from "lucide-react";
import { useState, useTransition } from "react";
import BoardFormModal from "./BoardFormModal";
import {
  deleteBoard,
  updateBoard,
} from "../../../app/dashboard/boards/actions";
import type { ActionResult } from "../../../app/dashboard/boards/actions";
import type { BoardWithMembers } from "@/types";

interface BoardCardProps {
  board: BoardWithMembers;
  isOwner: boolean;
  memberCount: number;
}

export default function BoardCard({
  board,
  isOwner,
  memberCount,
}: BoardCardProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Delete "${board.name}"? This cannot be undone.`)) {
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const result = await deleteBoard(board.id);
        if ("error" in result) setError(result.error);
      } catch {
        setError("Unable to delete this board. Please try again.");
      }
    });
  };

  return (
    <div
      className="flex flex-col rounded-2xl border bg-surface p-5 shadow-sm"
      style={{ borderTop: `6px solid ${board.theme}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{board.name}</h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
          {board.visibility === "Private" ? (
            <Lock aria-hidden="true" className="h-3 w-3" />
          ) : (
            <Hash aria-hidden="true" className="h-3 w-3" />
          )}
          {board.visibility}
        </span>
      </div>

      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">
        {board.description || "No description."}
      </p>

      <p className="mt-3 text-xs text-muted">
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/dashboard/boards/${board.id}`}
          className="rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary-hover"
        >
          Open
          Open board
        </Link>
        <Link
          href={`/dashboard/messenger/${board.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
        >
          <MessageSquare aria-hidden="true" className="h-4 w-4" />
          Open channel
        </Link>

        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-hover"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-lg border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
            >
              {pending ? "Deleting..." : "Delete"}
            </button>
          </>
        )}
      </div>

      {editing && (
        <BoardFormModal
          title="Edit board"
          submitLabel="Save changes"
          initial={board}
          onSubmit={(formData: FormData): Promise<ActionResult> =>
            updateBoard(board.id, formData)
          }
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
