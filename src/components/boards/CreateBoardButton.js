"use client";

import { useState } from "react";
import BoardFormModal from "./BoardFormModal";
import { createBoard } from "../../../app/dashboard/boards/actions";

export default function CreateBoardButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      >
        + New board
      </button>

      {open && (
        <BoardFormModal
          title="Create a new board"
          submitLabel="Create board"
          onSubmit={createBoard}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
