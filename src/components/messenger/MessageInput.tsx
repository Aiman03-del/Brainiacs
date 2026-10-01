"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { BarChart3, File, FileText, Image as ImageIcon, LoaderCircle, Paperclip, Send, X } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024;

interface MessageInputProps {
  onSend: (message: { text: string; file: File | null }) => Promise<string | null>;
  onOpenPoll: () => void;
  autoFocus?: boolean;
}

export default function MessageInput({ onSend, onOpenPoll, autoFocus = false }: MessageInputProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (autoFocus) messageRef.current?.focus();
  }, [autoFocus]);

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      setError("File is too large (max 10 MB).");
      return;
    }
    setError("");
    setFile(picked);
  };

  const submit = async () => {
    const clean = text.trim();
    if ((!clean && !file) || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError("");
    try {
      const failure = await onSend({ text: clean, file });
      if (failure) {
        setError(failure);
        return;
      }
      setText("");
      setFile(null);
    } catch {
      setError("Unable to send this message. Please try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-surface p-2 sm:p-3" aria-busy={sending}>
      {file && (
        <div className="mb-2 flex min-w-0 items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">
          {file.type.startsWith("image/") ? (
            <ImageIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          ) : file.type.startsWith("text/") || file.type === "application/pdf" ? (
            <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          ) : (
            <File aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          )}
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Remove file"
            title="Remove file"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          onChange={pickFile}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach file"
          title="Attach file"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-2.5 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary sm:px-3"
        >
          <Paperclip aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Attach</span>
        </button>
        <button
          type="button"
          onClick={onOpenPoll}
          aria-label="Create poll"
          title="Create poll"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-2.5 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary sm:px-3"
        >
          <BarChart3 aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Poll</span>
        </button>

        <textarea
          ref={messageRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={4000}
          aria-label="Write a message"
          placeholder="Write a message..."
          className="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary"
        />

        <button
          type="button"
          onClick={submit}
          disabled={sending || (!text.trim() && !file)}
          aria-label={sending ? "Sending message" : "Send message"}
          title={sending ? "Sending message" : "Send message"}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          {sending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
          <span className="hidden sm:inline">{sending ? "Sending..." : "Send"}</span>
        </button>
      </div>
    </div>
  );
}
