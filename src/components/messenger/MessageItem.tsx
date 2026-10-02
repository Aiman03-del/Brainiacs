"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Check,
  Download,
  File,
  FileText,
  Pencil,
  Pin,
  SmilePlus,
  Trash2,
  X,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import type { Database } from "@/types/database.types";
import type { Message, MessageAttachment } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "chat-attachments";
const REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentProps {
  supabase: SupabaseClient<Database>;
  file: MessageAttachment;
}

function Attachment({ supabase, file }: AttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setFailed(true);
          return;
        }
        setUrl(data.signedUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, file.path]);

  if (!url && !failed) {
    return <div aria-label={`Loading ${file.name}`} className="h-16 w-48 animate-pulse rounded-lg bg-surface-muted" />;
  }

  if (!url) {
    return (
      <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
        <File aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="truncate">{file.name}</span>
        <span className="shrink-0 text-xs">Preview unavailable</span>
      </div>
    );
  }

  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setPreviewOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  if (file.type?.startsWith("image/")) {
    return (
      <>
        <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface p-1.5">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            aria-label={`Preview image ${file.name}`}
            className="overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={file.name} className="max-h-52 max-w-full object-contain" />
          </button>
          <span className="min-w-0 pr-2">
            <span className="block max-w-40 truncate text-xs font-medium text-foreground">{file.name}</span>
            <span className="text-xs text-muted">{formatSize(file.size)}</span>
          </span>
          <a href={url} download={file.name} aria-label={`Download ${file.name}`} title="Download image" className="rounded p-1.5 text-muted hover:bg-surface-hover hover:text-foreground">
            <Download aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
        {previewOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Image preview: ${file.name}`}
            onKeyDown={handlePreviewKeyDown}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPreviewOpen(false);
            }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-overlay p-4"
          >
            <div className="flex max-h-full max-w-full flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <a href={url} download={file.name} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-surface px-3 text-sm text-foreground hover:bg-surface-hover">
                  <Download aria-hidden="true" className="h-4 w-4" />Download
                </a>
                <button type="button" autoFocus onClick={() => setPreviewOpen(false)} aria-label="Close image preview" className="rounded-lg bg-surface p-2 text-foreground hover:bg-surface-hover">
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={file.name} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
            </div>
          </div>
        )}
      </>
    );
  }

  const FileIcon = file.type?.startsWith("text/") || file.type === "application/pdf" ? FileText : File;
  return (
    <a
      href={url}
      download={file.name}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
    >
      <FileIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
      <span className="min-w-0 truncate">{file.name}</span>
      {file.size > 0 && <span className="shrink-0 text-xs text-muted">{formatSize(file.size)}</span>}
      <Download aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
    </a>
  );
}

interface MessageItemProps {
  message: Message;
  senderName: string;
  senderPhoto: string | null;
  userId: string;
  supabase: SupabaseClient<Database>;
  grouped?: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, text: string) => Promise<string | null>;
  onDelete: (messageId: string) => Promise<void>;
  onPin: (messageId: string, pinned: boolean) => void;
}

export default function MessageItem({
  message,
  senderName,
  senderPhoto,
  userId,
  supabase,
  grouped = false,
  onReact,
  onEdit,
  onDelete,
  onPin,
}: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text ?? "");
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMine = message.sender_id === userId;

  if (message.deleted_at) {
    return (
      <div id={`msg-${message.id}`} className="px-4 py-1 text-xs italic text-muted">
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

  const removeMessage = async () => {
    setDeleting(true);
    try {
      await onDelete(message.id);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setConfirmDelete(false);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled])");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const reactions = Object.entries(message.reactions ?? {});
  const attachments = message.attachments ?? [];
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const actionButtonClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary lg:h-8 lg:w-8";

  return (
    <>
      <article
        id={`msg-${message.id}`}
        aria-label={`${senderName}, ${time}`}
        className={`group relative flex flex-wrap gap-x-3 px-4 hover:bg-surface-hover ${grouped ? "py-0.5" : "py-2"}`}
      >
        {grouped ? (
          <span aria-hidden="true" className="h-9 w-9 shrink-0" />
        ) : (
          <Avatar name={senderName} src={senderPhoto} size={36} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {!grouped && <span className="text-sm font-semibold text-foreground">{senderName}</span>}
            <time dateTime={message.created_at} className="text-xs text-muted" suppressHydrationWarning>
              {time}
            </time>
            {message.edited_at && <span className="text-xs text-muted">(edited)</span>}
            {message.is_pinned && <Pin aria-label="Pinned message" className="h-3 w-3 text-primary" />}
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setEditing(false);
                    setDraft(message.text ?? "");
                    setError("");
                  }
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void saveEdit();
                  }
                }}
                aria-label="Edit message"
                rows={3}
                maxLength={4000}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={saveEdit} aria-label="Save edit" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary-hover">
                  <Check aria-hidden="true" className="h-4 w-4" />Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.text ?? "");
                    setError("");
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground hover:bg-surface-hover"
                >
                  <X aria-hidden="true" className="h-4 w-4" />Cancel
                </button>
                <span className="text-xs text-muted">Editing message</span>
              </div>
              {error && <p role="alert" className="text-xs text-danger">{error}</p>}
            </div>
          ) : (
            message.text && (
              <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground">
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
                    aria-pressed={mine}
                    aria-label={`${emoji}, ${users.length} reactions${mine ? ", you reacted" : ""}`}
                    className={`min-h-10 rounded-full border px-2 py-1 text-xs ${mine ? "border-primary bg-surface-muted text-foreground" : "bg-surface text-muted hover:bg-surface-hover"}`}
                  >
                    {emoji} {users.length}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!editing && (
          <div className="relative z-10 mt-1 flex w-full flex-wrap items-center justify-end gap-0.5 pl-12 lg:absolute lg:right-3 lg:top-1 lg:mt-0 lg:w-auto lg:pl-0 lg:rounded-lg lg:border lg:border-border lg:bg-surface lg:p-0.5 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPicker((previous) => !previous)}
                className={actionButtonClass}
                aria-label="Add reaction"
                aria-expanded={picker}
                title="Add reaction"
              >
                <SmilePlus aria-hidden="true" className="h-4 w-4" />
              </button>
              {picker && (
                <div className="absolute left-0 top-full z-20 mt-1 grid w-[9.25rem] grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1 shadow-lg sm:left-auto sm:right-0 sm:flex sm:w-auto">
                  {REACTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => {
                        setPicker(false);
                        onReact(message.id, emoji);
                      }}
                      aria-label={`React ${emoji}`}
                      title={`React ${emoji}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-base hover:bg-surface-hover"
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
              aria-label={message.is_pinned ? "Unpin message" : "Pin message"}
              title={message.is_pinned ? "Unpin message" : "Pin message"}
            >
              <Pin aria-hidden="true" className="h-4 w-4" />
            </button>

            {isMine && message.text && (
              <button
                type="button"
                onClick={() => {
                  setDraft(message.text ?? "");
                  setEditing(true);
                }}
                className={actionButtonClass}
                aria-label="Edit message"
                title="Edit message"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </button>
            )}

            {isMine && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`${actionButtonClass} text-danger hover:text-danger`}
                aria-label="Delete message"
                title="Delete message"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </article>

      {confirmDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`delete-title-${message.id}`}
          aria-describedby={`delete-description-${message.id}`}
          onKeyDown={handleDeleteDialogKeyDown}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setConfirmDelete(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl">
            <h2 id={`delete-title-${message.id}`} className="text-base font-semibold text-foreground">Delete this message?</h2>
            <p id={`delete-description-${message.id}`} className="mt-2 text-sm leading-5 text-muted">This message will be removed from the conversation.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="min-h-10 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={removeMessage}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-danger px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}