import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardCard from "@/components/boards/BoardCard";
import CreateBoardButton from "@/components/boards/CreateBoardButton";

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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Channels</h1>
          <p className="mt-1 text-sm text-muted">Boards are the channels your team works in.</p>
        </div>
        <CreateBoardButton label="Create channel" />
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          Failed to load boards: {error.message}
        </p>
      )}

      {myBoards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted">
          You have no boards yet. Create your first one!
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
