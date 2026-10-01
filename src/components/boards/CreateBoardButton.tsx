"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import BoardFormModal from "./BoardFormModal";
import { createBoard } from "../../../app/dashboard/boards/actions";

export default function CreateBoardButton({
  label = "New board",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleCreate = async (formData: FormData) => {
    const result = await createBoard(formData);
    if ("success" in result) router.refresh();
    return result;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        {label}
      </button>

      {open && (
        <BoardFormModal
          title="Create a new board"
          submitLabel="Create board"
          onSubmit={handleCreate}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
