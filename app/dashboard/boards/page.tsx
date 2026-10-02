import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardCard from "@/components/boards/BoardCard";
import CreateBoardButton from "@/components/boards/CreateBoardButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { MessagesSquare } from "lucide-react";

export default async function BoardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boards, error } = await supabase
    .from("boards")
    .select(
      "id, name, description, visibility, theme, created_by, created_at, board_members(user_id)",
    )
    .order("created_at", { ascending: false });

  const myBoards = (boards ?? []).filter((board) =>
    (board.board_members ?? []).some((member) => member.user_id === user.id),
  );

  if (error) {
    return (
      <ErrorState
        title="Channels couldn't load."
        description="Your channels are temporarily unavailable. Try again in a moment."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Channels</h1>
          <p className="mt-1 text-sm text-muted">Boards are the channels your team works in.</p>
        </div>
        <CreateBoardButton label="Create channel" />
      </div>

      {myBoards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface">
          <EmptyState
            icon={MessagesSquare}
            title="No channels yet"
            description="Create a channel to give your team a place to organize work and conversations."
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isOwner={board.created_by === user.id}
              memberCount={board.board_members?.length ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
