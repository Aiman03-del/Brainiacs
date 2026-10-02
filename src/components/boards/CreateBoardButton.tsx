"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
      <Button
        size="md"
        leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
        className="px-3 py-2"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

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
