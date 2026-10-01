"use client";

import { useState } from "react";
import { BarChart3, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { Poll } from "@/types";

interface PollsPanelProps {
  polls: Poll[];
  userId: string;
  nameOf: (userId: string) => string;
  onVote: (pollId: string, optionIndex: number) => Promise<void>;
  onDelete: (pollId: string) => Promise<void>;
}

export default function PollsPanel({
  polls,
  userId,
  nameOf,
  onVote,
  onDelete,
}: PollsPanelProps) {
  const [open, setOpen] = useState(false);

  if (polls.length === 0) return null;

  return (
    <div className="border-b border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex min-h-10 w-full items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2"><BarChart3 aria-hidden="true" className="h-4 w-4 text-muted" />Polls ({polls.length})</span>
        {open ? <ChevronUp aria-hidden="true" className="h-4 w-4 text-muted" /> : <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted" />}
      </button>

      {open && (
        <div className="max-h-72 space-y-3 overflow-y-auto px-4 pb-3">
          {polls.map((poll) => {
            const votes = poll.poll_votes ?? [];
            const total = votes.length;
            const mine = votes.find(
              (vote) => vote.user_id === userId,
            )?.option_index;

            return (
              <div key={poll.id} className="border-t border-border py-3 first:border-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {poll.question}
                  </p>
                  {poll.created_by === userId && (
                    <button
                      type="button"
                      onClick={() => onDelete(poll.id)}
                      aria-label="Delete poll"
                      title="Delete poll"
                      className="rounded p-1 text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-danger"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  by {nameOf(poll.created_by)} &middot; {total}{" "}
                  {total === 1 ? "vote" : "votes"}
                </p>

                <div className="mt-2 space-y-2">
                  {poll.options.map((option, index) => {
                    const count = votes.filter(
                      (vote) => vote.option_index === index,
                    ).length;
                    const percentage =
                      total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => onVote(poll.id, index)}
                        aria-pressed={mine === index}
                        className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm ${
                          mine === index ? "border-primary bg-surface-muted" : "border-border"
                        }`}
                      >
                        <span
                          className="absolute inset-y-0 left-0 bg-primary/15"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="relative flex justify-between gap-2 text-foreground">
                          <span className="truncate">{option}</span>
                          <span className="inline-flex shrink-0 items-center gap-1 text-muted">
                            {count} ({percentage}%)
                            {mine === index && <Check aria-label="Your vote" className="h-3.5 w-3.5 text-primary" />}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
