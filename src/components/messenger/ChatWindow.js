"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import PollsPanel from "./PollsPanel";
import PollModal from "./PollModal";

const BUCKET = "chat-attachments";

export default function ChatWindow({
  board,
  userId,
  members,
  initialMessages,
  initialPolls,
  pageSize,
}) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState(initialMessages);
  const [polls, setPolls] = useState(initialPolls);
  const [hasMore, setHasMore] = useState(initialMessages.length >= pageSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const stickRef = useRef(true);

  const nameOf = (id) => members[id]?.name ?? "Former member";

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
          setMessages((previous) =>
            previous.some((message) => message.id === payload.new.id)
              ? previous
              : [...previous, payload.new],
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
          setMessages((previous) =>
            previous.map((message) =>
              message.id === payload.new.id
                ? { ...message, ...payload.new }
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
          setPolls((previous) =>
            previous.some((poll) => poll.id === payload.new.id)
              ? previous
              : [{ ...payload.new, poll_votes: [] }, ...previous],
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
          const vote = payload.new;
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
    stickRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
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
        setError(searchError.message);
        return;
      }
      setResults({ query: cleanQuery, rows: data ?? [] });
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
      setError(loadError.message);
      return;
    }

    stickRef.current = false;
    const older = (data ?? []).slice().reverse();
    setMessages((previous) => {
      const ids = new Set(previous.map((message) => message.id));
      return [...older.filter((message) => !ids.has(message.id)), ...previous];
    });
    setHasMore((data ?? []).length >= pageSize);
  };

  const sendMessage = async ({ text, file }) => {
    let attachments = [];

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${board.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined });

      if (uploadError) return uploadError.message;

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
        attachments,
      })
      .select()
      .single();

    if (insertError) {
      if (attachments.length) {
        await supabase.storage
          .from(BUCKET)
          .remove(attachments.map((attachment) => attachment.path));
      }
      return insertError.message;
    }

    stickRef.current = true;
    setMessages((previous) =>
      previous.some((message) => message.id === data.id)
        ? previous
        : [...previous, data],
    );
    return null;
  };

  const editMessage = async (id, text) => {
    const { data, error: updateError } = await supabase
      .from("messages")
      .update({ text, edited_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return updateError.message;
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? { ...message, ...data } : message,
      ),
    );
    return null;
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
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
      setError(updateError.message);
      return;
    }

    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? { ...message, ...data } : message,
      ),
    );

    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  };

  const reactToMessage = async (id, emoji) => {
    setError("");
    const { data, error: rpcError } = await supabase.rpc("toggle_reaction", {
      p_message_id: id,
      p_emoji: emoji,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? { ...message, reactions: data } : message,
      ),
    );
  };

  const pinMessage = async (id, pinned) => {
    setError("");
    const { error: rpcError } = await supabase.rpc("set_message_pinned", {
      p_message_id: id,
      p_pinned: pinned,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? { ...message, is_pinned: pinned } : message,
      ),
    );
  };

  const createPoll = async (question, options) => {
    const { data, error: insertError } = await supabase
      .from("polls")
      .insert({ board_id: board.id, created_by: userId, question, options })
      .select()
      .single();

    if (insertError) return insertError.message;

    setPolls((previous) =>
      previous.some((poll) => poll.id === data.id)
        ? previous
        : [{ ...data, poll_votes: [] }, ...previous],
    );
    return null;
  };

  const votePoll = async (pollId, optionIndex) => {
    setError("");
    const { error: voteError } = await supabase
      .from("poll_votes")
      .upsert(
        { poll_id: pollId, user_id: userId, option_index: optionIndex },
        { onConflict: "poll_id,user_id" },
      );

    if (voteError) {
      setError(voteError.message);
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

  const deletePoll = async (pollId) => {
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

  const goToMessage = (id) => {
    document
      .getElementById(`msg-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: board.theme }}
        />
        <h2 className="min-w-0 flex-1 truncate font-semibold text-foreground">
          {board.name}
        </h2>

        <button
          type="button"
          onClick={() => setShowPinned((previous) => !previous)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
        >
          Pinned ({pinned.length})
        </button>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search messages"
          aria-label="Search messages"
          className="w-44 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border-b bg-danger-soft px-4 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

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
        className="flex-1 overflow-y-auto py-2"
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
        ) : (
          <>
            {hasMore && (
              <div className="py-2 text-center">
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingMore}
                  className="rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:bg-surface-hover disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load older messages"}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">
                No messages yet. Say hello!
              </p>
            )}

            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                senderName={nameOf(message.sender_id)}
                userId={userId}
                supabase={supabase}
                onReact={reactToMessage}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onPin={pinMessage}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageInput
        onSend={sendMessage}
        onOpenPoll={() => setShowPollModal(true)}
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
