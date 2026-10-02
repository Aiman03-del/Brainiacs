import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatWindow from "@/components/messenger/ChatWindow";
import { toMessage, toPoll } from "@/lib/messenger-data";
import type { Message, Poll } from "@/types";

const PAGE_SIZE = 50;

export default async function BoardChatPage({
  params,
}: PageProps<"/dashboard/messenger/[boardId]">) {
  const { boardId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: membership } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", boardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const [boardResult, membersResult, messagesResult, pollsResult] =
    await Promise.all([
      supabase
        .from("boards")
        .select("id, name, theme, visibility, description")
        .eq("id", boardId)
        .single(),
      supabase
        .from("board_members")
        .select("user_id, profiles(display_name, photo_url, email)")
        .eq("board_id", boardId),
      supabase
        .from("messages")
        .select("*")
        .eq("board_id", boardId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE),
      supabase
        .from("polls")
        .select("*, poll_votes(user_id, option_index)")
        .eq("board_id", boardId)
        .order("created_at", { ascending: false }),
    ]);

  if (!boardResult.data) notFound();

  const members: Record<string, { name: string; photo: string | null }> = {};
  (membersResult.data ?? []).forEach((member) => {
    members[member.user_id] = {
      name:
        member.profiles?.display_name ?? member.profiles?.email ?? "Unknown",
      photo: member.profiles?.photo_url ?? null,
    };
  });

  const initialMessages: Message[] = (messagesResult.data ?? [])
    .slice()
    .reverse()
    .map(toMessage);
  const initialPolls: Poll[] = (pollsResult.data ?? []).map((poll) =>
    toPoll(poll, poll.poll_votes ?? []),
  );

  return (
    <ChatWindow
      key={boardId}
      board={boardResult.data}
      userId={user.id}
      members={members}
      initialMessages={initialMessages}
      initialPolls={initialPolls}
      pageSize={PAGE_SIZE}
      initialLoadError={Boolean(messagesResult.error || pollsResult.error)}
    />
  );
}
