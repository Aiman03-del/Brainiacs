"use client";

import { useState } from "react";

export default function PollsPanel({
  polls,
  userId,
  nameOf,
  onVote,
  onDelete,
}) {
  const [open, setOpen] = useState(false);

  if (polls.length === 0) return null;

  return (
    <div className="border-b bg-surface-muted">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-foreground"
        aria-expanded={open}
      >
        <span>Polls ({polls.length})</span>
        <span className="text-muted">{open ? "Hide" : "Show"}</span>
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
              <div key={poll.id} className="rounded-xl border bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {poll.question}
                  </p>
                  {poll.created_by === userId && (
                    <button
                      type="button"
                      onClick={() => onDelete(poll.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Delete
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
                        className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm ${
                          mine === index ? "border-primary" : ""
                        }`}
                      >
                        <span
                          className="absolute inset-y-0 left-0 bg-primary/15"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="relative flex justify-between gap-2 text-foreground">
                          <span className="truncate">{option}</span>
                          <span className="text-muted">
                            {count} ({percentage}%)
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
