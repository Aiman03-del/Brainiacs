"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BoardList from "@/components/messenger/BoardList";
import type { BoardSummary } from "@/types";

interface MessengerShellProps {
  boards: BoardSummary[];
  children: ReactNode;
}

export default function MessengerShell({ boards, children }: MessengerShellProps) {
  const pathname = usePathname();
  const channelSelected =
    pathname !== "/dashboard/messenger" &&
    pathname.startsWith("/dashboard/messenger/");

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 overflow-hidden rounded-xl border border-border bg-surface md:h-[calc(100dvh-7rem)]">
      <div className={`${channelSelected ? "hidden md:flex" : "flex"} min-h-0 w-full md:w-auto`}>
        <BoardList boards={boards} />
      </div>
      <section className={`${channelSelected ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1`}>
        {children}
      </section>
    </div>
  );
}