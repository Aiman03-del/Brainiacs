"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, Lock, MessageCircle, Search } from "lucide-react";
import CreateBoardButton from "@/components/boards/CreateBoardButton";
import type { BoardSummary } from "@/types";

interface BoardListProps {
  boards: BoardSummary[];
}

export default function BoardList({ boards }: BoardListProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-surface md:w-64 md:shrink-0 md:border-r md:border-border">
      <header className="border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Workspace channels</p>
            <h2 className="mt-1 truncate text-base font-semibold text-foreground">Your channels</h2>
          </div>
          <Link
            href="/dashboard/search"
            aria-label="Search channels, messages, and people"
            title="Search workspace"
            className="rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Search aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-3">
          <CreateBoardButton label="Create channel" />
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-labelledby="channels-heading">
        <div className="mb-2 flex items-center justify-between px-2">
          <h3 id="channels-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
            Channels
          </h3>
          <span className="text-xs tabular-nums text-muted">{boards.length}</span>
        </div>

        {boards.length ? (
          <ul className="space-y-1">
            {boards.map((board) => {
              const href = `/dashboard/messenger/${board.id}`;
              const active = pathname === href;
              const PrivateIcon = board.visibility === "Private" ? Lock : Hash;
              return (
                <li key={board.id}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    aria-label={`${board.name}, ${board.visibility.toLowerCase()} channel`}
                    className={`flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
                      active
                        ? "bg-surface-muted font-semibold text-foreground"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <PrivateIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{board.name}</span>
                    <span className="shrink-0 text-[11px] text-muted">{board.visibility}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
            <Hash aria-hidden="true" className="mx-auto h-5 w-5 text-muted" />
            <p className="mt-2 text-sm font-medium text-foreground">No channels yet.</p>
            <p className="mt-1 text-xs leading-5 text-muted">Create a channel to start organizing team work.</p>
            <div className="mt-3 flex justify-center">
              <CreateBoardButton label="Create channel" />
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-border px-4 py-4" aria-labelledby="direct-messages-heading">
        <h3 id="direct-messages-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Direct Messages
        </h3>
        <div className="mt-3 flex items-center gap-2.5 rounded-md px-1 py-1">
          <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <p className="text-sm text-muted">No conversations yet.</p>
        </div>
      </section>
    </aside>
  );
}