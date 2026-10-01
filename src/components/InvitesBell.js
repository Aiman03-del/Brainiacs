"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InvitesBell({ userId, initialInvites }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [invites, setInvites] = useState(initialInvites);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

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

  const respond = async (id, status) => {
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={`Invitations${invites.length ? `, ${invites.length} pending` : ""}`}
        aria-expanded={open}
        className="relative rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
      >
        Invites
        {invites.length > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-semibold text-primary-foreground">
            {invites.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border bg-surface p-3 shadow-xl">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Board invitations
          </h3>

          {invites.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              No pending invitations.
            </p>
          ) : (
            <ul className="space-y-2">
              {invites.map((invite) => (
                <li key={invite.id} className="rounded-lg border p-3">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">
                      {invite.sender?.display_name ?? "Someone"}
                    </span>{" "}
                    invited you to join{" "}
                    <span className="font-medium">
                      {invite.boards?.name ?? "a board"}
                    </span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => respond(invite.id, "accepted")}
                      disabled={busyId === invite.id}
                      className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(invite.id, "rejected")}
                      disabled={busyId === invite.id}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:bg-surface-hover disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
