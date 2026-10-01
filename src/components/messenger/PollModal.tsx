"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { PollOptions } from "@/types";

interface PollModalProps {
  onCreate: (question: string, options: PollOptions) => Promise<string | null>;
  onClose: () => void;
}

export default function PollModal({ onCreate, onClose }: PollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setOption = (index: number, value: string) =>
    setOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanQuestion = question.trim();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!cleanQuestion) {
      setError("Question is required.");
      return;
    }
    if (cleanOptions.length < 2) {
      setError("Add at least 2 options.");
      return;
    }
    if (
      new Set(cleanOptions.map((option) => option.toLowerCase())).size !==
      cleanOptions.length
    ) {
      setError("Options must be different from each other.");
      return;
    }

    setBusy(true);
    try {
      const failure = await onCreate(cleanQuestion, cleanOptions);
      if (failure) {
        setError(failure);
      } else {
        onClose();
      }
    } catch {
      setError("Unable to create this poll. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-foreground">
          Create a poll
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={200}
            placeholder="Ask a question"
            className={fieldClass}
          />

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={option}
                  onChange={(event) => setOption(index, event.target.value)}
                  maxLength={100}
                  placeholder={`Option ${index + 1}`}
                  className={fieldClass}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((previous) =>
                        previous.filter(
                          (_, optionIndex) => optionIndex !== index,
                        ),
                      )
                    }
                    aria-label="Remove option"
                    className="rounded-lg px-2 text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={() => setOptions((previous) => [...previous, ""])}
              className="text-sm text-primary hover:underline"
            >
              + Add option
            </button>
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
