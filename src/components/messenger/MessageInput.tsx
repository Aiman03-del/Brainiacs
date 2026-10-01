"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024;

interface MessageInputProps {
  onSend: (message: { text: string; file: File | null }) => Promise<string | null>;
  onOpenPoll: () => void;
}

export default function MessageInput({ onSend, onOpenPoll }: MessageInputProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
    if ((!clean && !file) || sending) return;

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
    <div className="border-t bg-surface p-3">
      {file && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-surface-muted px-3 py-1.5 text-sm text-foreground">
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="ml-3 text-muted hover:text-danger"
            aria-label="Remove file"
          >
            &times;
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
          className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
        >
          Attach
        </button>
        <button
          type="button"
          onClick={onOpenPoll}
          className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
        >
          Poll
        </button>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={4000}
          placeholder="Write a message... (Enter to send, Shift+Enter for a new line)"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />

        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
