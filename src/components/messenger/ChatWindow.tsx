"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ChevronRight, Hash, LoaderCircle, Lock, MessageSquare, Pin, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import PollsPanel from "./PollsPanel";
import PollModal from "./PollModal";
import type {
  BoardSummary,
  Message,
  MessageAttachment,
  MessageReactions,
  MessageRow as MessageDatabaseRow,
  Poll,
  PollOptions,
  PollRow as PollDatabaseRow,
  PollVote,
} from "@/types";
import type { Json } from "@/types/database.types";

const BUCKET = "chat-attachments";

type ChatMembers = Record<string, { name: string; photo: string | null }>;
type SearchResults = { query: string; rows: Message[] };

interface ChatWindowProps {
  board: BoardSummary;
  userId: string;
  members: ChatMembers;
  initialMessages: Message[];
  initialPolls: Poll[];
  pageSize: number;
  initialLoadError?: boolean;
}

function toMessage(row: MessageDatabaseRow): Message {
  return {
    ...row,
    attachments: row.attachments as unknown as MessageAttachment[],
    reactions: row.reactions as MessageReactions,
  };
}

function toPoll(
  row: PollDatabaseRow,
  pollVotes: Poll["poll_votes"] = [],
): Poll {
  return {
    ...row,
    options: row.options as PollOptions,
    poll_votes: pollVotes,
  };
}

export default function ChatWindow({
  board,
  userId,
  members,
  initialMessages,
  initialPolls,
  pageSize,
  initialLoadError = false,
}: ChatWindowProps) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [hasMore, setHasMore] = useState(initialMessages.length >= pageSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(initialLoadError);
  const [retrying, setRetrying] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<boolean>(true);

  const nameOf = (id: string) => members[id]?.name ?? "Former member";

  useEffect(() => {
    const boardFilter = `board_id=eq.${board.id}`;

    const channel = supabase
      .channel(`chat-${board.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: boardFilter,
        },
        (payload) => {
          const message = toMessage(payload.new as unknown as MessageDatabaseRow);
          if (!stickRef.current) setHasNewMessages(true);
          setMessages((previous) =>
            previous.some((entry) => entry.id === message.id)
              ? previous
              : [...previous, message],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: boardFilter,
        },
        (payload) => {
          const incoming = toMessage(
            payload.new as unknown as MessageDatabaseRow,
          );
          setMessages((previous) =>
            previous.map((message) =>
              message.id === incoming.id
                ? { ...message, ...incoming }
                : message,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "polls",
          filter: boardFilter,
        },
        (payload) => {
          const poll = toPoll(payload.new as unknown as PollDatabaseRow);
          setPolls((previous) =>
            previous.some((entry) => entry.id === poll.id)
              ? previous
              : [{ ...poll, poll_votes: [] }, ...previous],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "polls" },
        (payload) => {
          setPolls((previous) =>
            previous.filter((poll) => poll.id !== payload.old.id),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const vote = payload.new as unknown as Pick<
            PollVote,
            "poll_id" | "user_id" | "option_index"
          >;
          setPolls((previous) =>
            previous.map((poll) => {
              if (poll.id !== vote.poll_id) return poll;
              const others = (poll.poll_votes ?? []).filter(
                (entry) => entry.user_id !== vote.user_id,
              );
              return {
                ...poll,
                poll_votes: [
                  ...others,
                  { user_id: vote.user_id, option_index: vote.option_index },
                ],
              };
            }),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, board.id]);

  useEffect(() => {
    if (stickRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages.length]);

  const handleScroll = () => {
    const element = listRef.current;
    if (!element) return;
    stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (stickRef.current) setHasNewMessages(false);
  };

  const retryInitialLoad = async () => {
    if (retrying) return;
    setRetrying(true);
    const [messagesResult, pollsResult] = await Promise.all([
      supabase
        .from("messages")
        .select("*")
        .eq("board_id", board.id)
        .order("created_at", { ascending: false })
        .limit(pageSize),
      supabase
        .from("polls")
        .select("*, poll_votes(user_id, option_index)")
        .eq("board_id", board.id)
        .order("created_at", { ascending: false }),
    ]);
    setRetrying(false);

    if (messagesResult.error || pollsResult.error) {
      setLoadFailed(true);
      return;
    }

    const refreshedMessages = (messagesResult.data ?? [])
      .slice()
      .reverse()
      .map((row) => toMessage(row as MessageDatabaseRow));
    setMessages(refreshedMessages);
    setPolls((pollsResult.data ?? []).map((row) => toPoll(row as PollDatabaseRow, row.poll_votes ?? [])));
    setHasMore((messagesResult.data ?? []).length >= pageSize);
    setLoadFailed(false);
    setError("");
    stickRef.current = true;
  };

  const scrollToLatest = () => {
    stickRef.current = true;
    setHasNewMessages(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const cleanQuery = query.replace(/[%_\\]/g, "").trim();
  const searching = cleanQuery.length >= 2;
  const searchRows = results?.query === cleanQuery ? results.rows : null;

  useEffect(() => {
    if (cleanQuery.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error: searchError } = await supabase
        .from("messages")
        .select("*")
        .eq("board_id", board.id)
        .is("deleted_at", null)
        .ilike("text", `%${cleanQuery}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (searchError) {
        setError("Unable to search messages. Please try again.");
        return;
      }
      setResults({
        query: cleanQuery,
        rows: (data ?? []).map((row) =>
          toMessage(row as MessageDatabaseRow),
        ),
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery, supabase, board.id]);

  const loadOlder = async () => {
    if (!messages.length || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const { data, error: loadError } = await supabase
      .from("messages")
      .select("*")
      .eq("board_id", board.id)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(pageSize);

    setLoadingMore(false);

    if (loadError) {
      setError("Unable to load older messages. Please try again.");
      return;
    }

    stickRef.current = false;
    const older = (data ?? [])
      .map((row) => toMessage(row as MessageDatabaseRow))
      .reverse();
    setMessages((previous) => {
      const ids = new Set(previous.map((message) => message.id));
      return [...older.filter((message) => !ids.has(message.id)), ...previous];
    });
    setHasMore((data ?? []).length >= pageSize);
  };

  const sendMessage = async ({
    text,
    file,
  }: {
    text: string;
    file: File | null;
  }): Promise<string | null> => {
    let attachments: MessageAttachment[] = [];

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${board.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined });

      if (uploadError) return "Unable to upload this attachment. Please try again.";

      attachments = [
        { path, name: file.name, type: file.type, size: file.size },
      ];
    }

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        board_id: board.id,
        sender_id: userId,
        text: text || null,
        attachments: attachments as unknown as Json,
      })
      .select()
      .single();

    if (insertError) {
      if (attachments.length) {
        await supabase.storage
          .from(BUCKET)
          .remove(attachments.map((attachment) => attachment.path));
      }
      return "Unable to send this message. Please try again.";
    }

    stickRef.current = true;
    setHasNewMessages(false);
    setMessages((previous) =>
      previous.some((message) => message.id === data.id)
        ? previous
        : [...previous, toMessage(data)],
    );
    return null;
  };

  const editMessage = async (
    id: string,
    text: string,
  ): Promise<string | null> => {
    const { data, error: updateError } = await supabase
      .from("messages")
      .update({ text, edited_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return "Unable to edit this message. Please try again.";
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? toMessage(data) : message,
      ),
    );
    return null;
  };

  const deleteMessage = async (id: string): Promise<void> => {
    setError("");

    const target = messages.find((message) => message.id === id);
    const paths = (target?.attachments ?? []).map(
      (attachment) => attachment.path,
    );

    const { data, error: updateError } = await supabase
      .from("messages")
      .update({
        deleted_at: new Date().toISOString(),
        text: null,
        attachments: [],
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      setError("Unable to delete this message. Please try again.");
      return;
    }

    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? toMessage(data) : message,
      ),
    );

    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  };

  const reactToMessage = async (id: string, emoji: string): Promise<void> => {
    setError("");
    const { data, error: rpcError } = await supabase.rpc("toggle_reaction", {
      p_message_id: id,
      p_emoji: emoji,
    });

    if (rpcError) {
      setError("Unable to update the reaction. Please try again.");
      return;
    }
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id
          ? { ...message, reactions: data as MessageReactions }
          : message,
      ),
    );
  };

  const pinMessage = async (id: string, pinned: boolean): Promise<void> => {
    setError("");
    const { error: rpcError } = await supabase.rpc("set_message_pinned", {
      p_message_id: id,
      p_pinned: pinned,
    });

    if (rpcError) {
      setError("Unable to update the pinned state. Please try again.");
      return;
    }
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? { ...message, is_pinned: pinned } : message,
      ),
    );
  };

  const createPoll = async (
    question: string,
    options: PollOptions,
  ): Promise<string | null> => {
    const { data, error: insertError } = await supabase
      .from("polls")
      .insert({ board_id: board.id, created_by: userId, question, options })
      .select()
      .single();

    if (insertError) return "Unable to create this poll. Please try again.";

    setPolls((previous) =>
      previous.some((poll) => poll.id === data.id)
        ? previous
        : [toPoll(data), ...previous],
    );
    return null;
  };

  const votePoll = async (
    pollId: string,
    optionIndex: number,
  ): Promise<void> => {
    setError("");
    const { error: voteError } = await supabase
      .from("poll_votes")
      .upsert(
        { poll_id: pollId, user_id: userId, option_index: optionIndex },
        { onConflict: "poll_id,user_id" },
      );

    if (voteError) {
      setError("Unable to record your vote. Please try again.");
      return;
    }

    setPolls((previous) =>
      previous.map((poll) => {
        if (poll.id !== pollId) return poll;
        const others = (poll.poll_votes ?? []).filter(
          (vote) => vote.user_id !== userId,
        );
        return {
          ...poll,
          poll_votes: [
            ...others,
            { user_id: userId, option_index: optionIndex },
          ],
        };
      }),
    );
  };

  const deletePoll = async (pollId: string): Promise<void> => {
    if (!window.confirm("Delete this poll?")) return;
    setError("");

    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setPolls((previous) => previous.filter((poll) => poll.id !== pollId));
  };

  const pinned = messages.filter(
    (message) => message.is_pinned && !message.deleted_at,
  );

  const goToMessage = (id: string) => {
    document
      .getElementById(`msg-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/dashboard/messenger"
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            Channels
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
          {board.visibility === "Private" ? (
            <span role="img" aria-label="Private channel" title="Private channel" className="shrink-0 text-muted">
              <Lock aria-hidden="true" className="h-4 w-4" />
            </span>
          ) : (
            <span role="img" aria-label="Public channel" title="Public channel" className="shrink-0 text-muted">
              <Hash aria-hidden="true" className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {board.name}
            </h2>
            {board.description && (
              <p className="hidden truncate text-xs text-muted sm:block">{board.description}</p>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={`/dashboard/boards/${board.id}`}
            aria-label={`Members, ${Object.keys(members).length} total`}
            title={`Members (${Object.keys(members).length})`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Users aria-hidden="true" className="h-4 w-4" />
            <span className="hidden text-xs sm:inline">{Object.keys(members).length}</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowPinned((previous) => !previous)}
            aria-label={`Pinned items, ${pinned.length}`}
            aria-pressed={showPinned}
            title={`Pinned (${pinned.length})`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Pin aria-hidden="true" className="h-4 w-4" />
            <span className="hidden text-xs sm:inline">{pinned.length}</span>
          </button>
          <label className="flex h-9 w-32 items-center gap-1.5 rounded-md border border-border bg-surface px-2 sm:w-44">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages"
              aria-label="Search messages"
              className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted"
            />
          </label>
        </div>
      </div>

      {loadFailed ? (
        <div role="alert" className="flex items-center justify-between gap-3 border-b bg-danger-soft px-4 py-2 text-sm text-danger">
          <span>Unable to load messages.</span>
          <button type="button" onClick={retryInitialLoad} disabled={retrying} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-surface/60 disabled:opacity-60">
            {retrying && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Try again
          </button>
        </div>
      ) : error ? (
        <p role="alert" className="border-b bg-danger-soft px-4 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <PollsPanel
        polls={polls}
        userId={userId}
        nameOf={nameOf}
        onVote={votePoll}
        onDelete={deletePoll}
      />

      {showPinned && (
        <div className="max-h-48 space-y-1 overflow-y-auto border-b bg-surface-muted px-4 py-2">
          {pinned.length === 0 ? (
            <p className="text-sm text-muted">No pinned messages.</p>
          ) : (
            pinned.map((message) => (
              <div key={message.id} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => goToMessage(message.id)}
                  className="min-w-0 flex-1 truncate text-left text-foreground hover:underline"
                >
                  <span className="font-medium">
                    {nameOf(message.sender_id)}:
                  </span>{" "}
                  {message.text || "Attachment"}
                </button>
                <button
                  type="button"
                  onClick={() => pinMessage(message.id, false)}
                  className="text-xs text-muted hover:text-danger"
                >
                  Unpin
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto py-2"
      >
        {searching ? (
          searchRows === null ? (
            <p className="p-6 text-center text-sm text-muted">Searching...</p>
          ) : searchRows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              No messages found.
            </p>
          ) : (
            searchRows.map((message) => (
              <div key={message.id} className="px-4 py-2">
                <p className="text-xs text-muted" suppressHydrationWarning>
                  {nameOf(message.sender_id)} &middot;{" "}
                  {new Date(message.created_at).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap wrap-break-word text-sm text-foreground">
                  {message.text}
                </p>
              </div>
            ))
          )
        ) : loadFailed ? null : (
          <>
            {hasMore && (
              <div className="py-2 text-center">
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingMore}
                  className="rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:bg-surface-hover disabled:opacity-60"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                      Loading older messages...
                    </span>
                  ) : "Load older messages"}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-muted">
                  <MessageSquare aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Start the conversation</h3>
                <p className="mt-1 text-sm text-muted">Send the first message to your team.</p>
              </div>
            )}
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const grouped = Boolean(
                previous &&
                  !previous.deleted_at &&
                  !message.deleted_at &&
                  previous.sender_id === message.sender_id &&
                  new Date(message.created_at).getTime() -
                    new Date(previous.created_at).getTime() <
                    5 * 60 * 1000,
              );
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  senderName={nameOf(message.sender_id)}
                  senderPhoto={members[message.sender_id]?.photo ?? null}
                  userId={userId}
                  supabase={supabase}
                  grouped={grouped}
                  onReact={reactToMessage}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onPin={pinMessage}
                />
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
        {hasNewMessages && !searching && (
          <button
            type="button"
            onClick={scrollToLatest}
            className="absolute bottom-3 left-1/2 inline-flex min-h-9 -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground shadow-sm hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
          >
            New messages <ArrowDown aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <MessageInput
        onSend={sendMessage}
        onOpenPoll={() => setShowPollModal(true)}
        autoFocus={messages.length === 0 && !loadFailed}
      />

      {showPollModal && (
        <PollModal
          onCreate={createPoll}
          onClose={() => setShowPollModal(false)}
        />
      )}
    </div>
  );
}
