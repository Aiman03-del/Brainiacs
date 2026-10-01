"use client";

import { useEffect, useState } from "react";

const BUCKET = "chat-attachments";
const REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Attachment({ supabase, file }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, 3600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, file.path]);

  if (!url) {
    return (
      <div className="h-16 w-40 animate-pulse rounded-lg bg-surface-muted" />
    );
  }

  if (file.type?.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={file.name}
          className="max-h-60 max-w-full rounded-lg border"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm text-primary hover:bg-surface-hover"
    >
      {file.name}
      <span className="text-xs text-muted">({formatSize(file.size)})</span>
    </a>
  );
}

export default function MessageItem({
  message,
  senderName,
  userId,
  supabase,
  onReact,
  onEdit,
  onDelete,
  onPin,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text ?? "");
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");

  const isMine = message.sender_id === userId;

  if (message.deleted_at) {
    return (
      <div
        id={`msg-${message.id}`}
        className="px-4 py-1 text-xs italic text-muted"
      >
        {senderName} deleted a message
      </div>
    );
  }

  const saveEdit = async () => {
    const clean = draft.trim();
    if (!clean) {
      setError("Message cannot be empty.");
      return;
    }
    if (clean === message.text) {
      setEditing(false);
      return;
    }

    const failure = await onEdit(message.id, clean);
    if (failure) {
      setError(failure);
    } else {
      setError("");
      setEditing(false);
    }
  };

  const reactions = Object.entries(message.reactions ?? {});
  const attachments = message.attachments ?? [];
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const actionButtonClass =
    "rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground";

  return (
    <div
      id={`msg-${message.id}`}
      className="group relative flex gap-3 px-4 py-2 hover:bg-surface-hover"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {(senderName ?? "?").charAt(0).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {senderName}
          </span>
          <span className="text-xs text-muted" suppressHydrationWarning>
            {time}
          </span>
          {message.edited_at && (
            <span className="text-xs text-muted">(edited)</span>
          )}
          {message.is_pinned && (
            <span className="text-xs text-primary">pinned</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={4000}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(message.text ?? "");
                  setError("");
                }}
                className="rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
        ) : (
          message.text && (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
              {message.text}
            </p>
          )
        )}

        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <Attachment key={file.path} supabase={supabase} file={file} />
            ))}
          </div>
        )}

        {reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {reactions.map(([emoji, users]) => {
              const mine = users.includes(userId);
              return (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    mine
                      ? "border-primary bg-surface-muted text-foreground"
                      : "bg-surface text-muted hover:bg-surface-hover"
                  }`}
                >
                  {emoji} {users.length}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!editing && (
        <div className="absolute right-4 top-1 flex items-center gap-0.5 rounded-lg border bg-surface p-0.5 shadow-sm md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPicker((previous) => !previous)}
              className={actionButtonClass}
              aria-label="Add reaction"
            >
              React
            </button>
            {picker && (
              <div className="absolute right-0 top-full z-20 mt-1 flex gap-1 rounded-lg border bg-surface p-1 shadow-lg">
                {REACTIONS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => {
                      setPicker(false);
                      onReact(message.id, emoji);
                    }}
                    className="rounded-md px-1.5 py-1 text-base hover:bg-surface-hover"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onPin(message.id, !message.is_pinned)}
            className={actionButtonClass}
          >
            {message.is_pinned ? "Unpin" : "Pin"}
          </button>

          {isMine && message.text && (
            <button
              type="button"
              onClick={() => {
                setDraft(message.text ?? "");
                setEditing(true);
              }}
              className={actionButtonClass}
            >
              Edit
            </button>
          )}

          {isMine && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="rounded-md px-2 py-1 text-xs text-danger hover:bg-danger-soft"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
