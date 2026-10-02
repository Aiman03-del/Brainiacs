"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Bot,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import Avatar from "@/components/Avatar";

const MAX_CHARS = 4000;
type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Break down a new project into tasks",
  "Draft a clear team update",
  "Turn a goal into a project checklist",
  "Brainstorm approaches to a challenge",
];

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const requestResponse = async (history: ChatMessage[]) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");
    setCanRetry(false);
    setStreaming(true);
    setMessages([...history, { role: "assistant", content: "" }]);

    let responseText = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Brainiacs AI couldn’t respond right now. Try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted || abortRef.current !== controller) break;
        responseText += decoder.decode(value, { stream: true });
        setMessages((previous) => {
          if (abortRef.current !== controller) return previous;
          const next = [...previous];
          const last = next[next.length - 1];
          if (!last || last.role !== "assistant") return previous;
          next[next.length - 1] = { ...last, content: responseText };
          return next;
        });
      }
      responseText += decoder.decode();
      if (!controller.signal.aborted && !responseText.trim()) {
        setError("Brainiacs AI returned an empty response. Try again.");
        setCanRetry(true);
      }
    } catch (requestError: unknown) {
      if (
        !(requestError instanceof DOMException) ||
        requestError.name !== "AbortError"
      ) {
        setError("Something went wrong. Try again.");
        setCanRetry(true);
      }
    } finally {
      if (abortRef.current === controller) {
        setMessages((previous) =>
          previous.length &&
          previous[previous.length - 1].role === "assistant" &&
          previous[previous.length - 1].content === ""
            ? previous.slice(0, -1)
            : previous,
        );
        abortRef.current = null;
        busyRef.current = false;
        setStreaming(false);
      }
    }
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || busyRef.current) return;
    setInput("");
    void requestResponse([...messages, { role: "user", content: clean }]);
  };

  const retry = () => {
    if (busyRef.current || messages[messages.length - 1]?.role !== "user") return;
    void requestResponse(messages);
  };

  const stop = () => abortRef.current?.abort();

  const newConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setMessages([]);
    setInput("");
    setError("");
    setCanRetry(false);
    setStreaming(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      send(input);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Brainiacs AI assistant">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">Brainiacs AI</h1>
            <p className="truncate text-xs text-muted">Your planning and writing assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={newConversation}
          disabled={messages.length === 0 && !error && !streaming}
          aria-label="New conversation"
          title="New conversation"
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">New conversation</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8">
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">How can I help?</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
              Ask Brainiacs AI to plan tasks, summarize text you share, draft a message, or brainstorm ideas.
            </p>
            <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted">
              Responses use your prompts only; Brainiacs AI doesn&apos;t currently read workspace data.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6" role="log" aria-label="AI conversation" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const waiting = !isUser && message.content === "" && streaming;
              return (
                <article key={`${message.role}-${index}`} className="flex gap-3">
                  {isUser ? (
                    <Avatar name="You" size={34} />
                  ) : (
                    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles aria-hidden="true" className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="mb-1 text-xs font-semibold text-muted">{isUser ? "You" : "Brainiacs AI"}</p>
                    {waiting ? (
                      <div role="status" className="inline-flex items-center gap-2 text-sm text-muted">
                        <span className="flex gap-1" aria-hidden="true">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
                        </span>
                        Thinking...
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground">
                        {message.content}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-t border-danger/20 bg-danger-soft px-4 py-2.5 sm:px-6">
          <p className="text-sm text-danger">{error}</p>
          {canRetry && messages[messages.length - 1]?.role === "user" && (
            <button type="button" onClick={retry} disabled={streaming} className="inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger disabled:opacity-60">
              <RotateCcw aria-hidden="true" className="h-4 w-4" />Try again
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="border-t border-border bg-surface p-3 sm:px-6 sm:py-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <label className="sr-only" htmlFor="assistant-prompt">Ask Brainiacs AI</label>
          <textarea
            id="assistant-prompt"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_CHARS}
            placeholder="Ask Brainiacs AI..."
            aria-label="Ask Brainiacs AI"
            className="max-h-36 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generating"
              title="Stop generating"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Square aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send prompt"
              title="Send prompt"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-muted">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </section>
  );
}