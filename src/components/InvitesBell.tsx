"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock3, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { BoardInvite } from "@/types";

interface InvitesBellProps {
  userId: string;
  initialInvites: BoardInvite[];
}

export default function InvitesBell({
  userId,
  initialInvites,
}: InvitesBellProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [invites, setInvites] = useState<BoardInvite[]>(initialInvites);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("join_requests")
      .select(
        "id, board_id, created_at, boards(name), sender:profiles!sender_id(display_name)",
      )
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setInvites(data ?? []);
  }, [supabase, userId]);

  useEffect(() => {
    const channel = supabase
      .channel(`invites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "join_requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, refetch]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const respond = async (
    id: string,
    status: "accepted" | "rejected",
  ): Promise<void> => {
    setError("");
    setBusyId(id);

    try {
      const { error: rpcError } = await supabase.rpc(
        "respond_to_join_request",
        {
          request_id: id,
          new_status: status,
        },
      );

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      await refetch();
      if (status === "accepted") router.refresh();
    } catch {
      setError("Unable to respond to this invitation. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={`Notifications${invites.length ? `, ${invites.length} pending board invitations` : ""}`}
        aria-expanded={open}
        aria-controls="board-invitations-panel"
        title="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
        {invites.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {invites.length > 99 ? "99+" : invites.length}
          </span>
        )}
      </button>

      {open && (
        <section
          id="board-invitations-panel"
          aria-label="Notifications"
          className="fixed right-3 top-16 z-40 max-h-[min(32rem,calc(100dvh-5rem))] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl sm:absolute sm:right-0 sm:top-auto sm:mt-2"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-muted">Board invitations</p>
            </div>
            {invites.length > 0 && (
              <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-foreground">
                {invites.length} pending
              </span>
            )}
          </header>

          {invites.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell aria-hidden="true" className="mx-auto h-5 w-5 text-muted" />
              <p className="mt-2 text-sm font-medium text-foreground">
                You&apos;re all caught up.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {invites.map((invite) => (
                <li key={invite.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                      <Users aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5 text-foreground">
                        <span className="font-medium">
                          {invite.sender?.display_name ?? "Someone"}
                        </span>{" "}
                        invited you to join{" "}
                        <span className="font-medium">
                          {invite.boards?.name ?? "a board"}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Clock3 aria-hidden="true" className="h-3 w-3" />
                        <time dateTime={invite.created_at} suppressHydrationWarning>
                          {new Intl.DateTimeFormat(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(invite.created_at))}
                        </time>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => respond(invite.id, "accepted")}
                      disabled={busyId === invite.id}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Check aria-hidden="true" className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(invite.id, "rejected")}
                      disabled={busyId === invite.id}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="border-t border-border px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
