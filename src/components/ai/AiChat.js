"use client";

import { useEffect, useRef, useState } from "react";

const MAX_CHARS = 4000;

const SUGGESTIONS = [
  "Break down a website redesign project into tasks",
  "Write a polite reminder message for my team about a deadline",
  "Give me 5 ideas for a team-building activity",
  "Summarize the pros and cons of daily stand-up meetings",
];

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text) => {
    const clean = text.trim();
    if (!clean || streaming) return;

    setError("");
    const history = [...messages, { role: "user", content: clean }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      if (!response.body) throw new Error("The AI response could not be read.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((previous) => {
          const next = [...previous];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Something went wrong.");
      }
    } finally {
      setMessages((previous) =>
        previous.length && previous[previous.length - 1].content === ""
          ? previous.slice(0, -1)
          : previous,
      );
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError("");
  };

  const handleKeyDown = (event) => {
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="font-semibold text-foreground">Brainiacs AI</h1>
          <p className="text-xs text-muted">
            Ask for task plans, drafts, ideas or summaries.
          </p>
        </div>
        <button
          onClick={clear}
          disabled={messages.length === 0}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover disabled:opacity-50"
        >
          Clear chat
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="mx-auto mt-8 max-w-xl text-center">
            <p className="mb-4 text-sm text-muted">Try one of these:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="rounded-xl border bg-surface p-3 text-left text-sm text-foreground hover:bg-surface-hover"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === "user";
            const waiting = !isUser && message.content === "" && streaming;
            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-foreground"
                  }`}
                >
                  {waiting ? (
                    <span className="text-muted">Thinking...</span>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t bg-danger-soft px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="border-t bg-surface p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_CHARS}
            placeholder="Ask anything... (Enter to send, Shift+Enter for a new line)"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />

          {streaming ? (
            <button
              onClick={stop}
              className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
