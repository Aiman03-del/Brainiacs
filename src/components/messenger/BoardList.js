"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BoardList({ boards }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r bg-surface">
      <h2 className="border-b px-4 py-3 text-sm font-semibold text-foreground">
        Boards
      </h2>

      {boards.length === 0 ? (
        <p className="p-4 text-sm text-muted">
          You are not a member of any board yet.
        </p>
      ) : (
        <ul>
          {boards.map((board) => {
            const href = `/dashboard/messenger/${board.id}`;
            const active = pathname === href;

            return (
              <li key={board.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-hover ${
                    active
                      ? "bg-surface-muted font-semibold text-foreground"
                      : "text-muted"
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: board.theme }}
                  />
                  <span className="truncate">{board.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
