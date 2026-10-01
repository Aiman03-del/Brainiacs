"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BoardMemberWithProfile, ProfileSearchResult } from "@/types";

function Avatar({ name }: { name: string | null | undefined }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

interface MembersButtonProps {
  boardId: string;
  userId: string;
  isOwner: boolean;
  members: BoardMemberWithProfile[];
}

export default function MembersButton({
  boardId,
  userId,
  isOwner,
  members,
}: MembersButtonProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const cleanQuery = query.replace(/[%_,()\\]/g, "").trim();
    let cancelled = false;

    if (!open || cleanQuery.length < 2) {
      const resetTimer = setTimeout(() => {
        if (!cancelled) {
          setResults([]);
          setSearching(false);
        }
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(resetTimer);
      };
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("id, display_name, email, photo_url")
        .or(`display_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`)
        .limit(8);

      if (cancelled) return;
      setSearching(false);

      if (searchError) {
        setError(searchError.message);
        return;
      }

      const memberIds = members.map((member) => member.user_id);
      setResults(
        (data ?? []).filter((profile) => !memberIds.includes(profile.id)),
      );
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, supabase, members]);

  const invite = async (profile: ProfileSearchResult): Promise<void> => {
    setError("");
    setMessage("");

    const { error: insertError } = await supabase.from("join_requests").insert({
      board_id: boardId,
      sender_id: userId,
      receiver_id: profile.id,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("This person already has a pending invite.");
        setInvited((previous) =>
          previous.includes(profile.id) ? previous : [...previous, profile.id],
        );
      } else {
        setError(insertError.message);
      }
      return;
    }

    setInvited((previous) => [...previous, profile.id]);
    setMessage(`Invite sent to ${profile.display_name ?? profile.email}.`);
  };

  const removeMember = async (
    targetId: string,
    isSelf: boolean,
  ): Promise<void> => {
    const question = isSelf ? "Leave this board?" : "Remove this member?";
    if (!window.confirm(question)) return;

    setError("");
    setMessage("");

    const { error: deleteError, count } = await supabase
      .from("board_members")
      .delete({ count: "exact" })
      .eq("board_id", boardId)
      .eq("user_id", targetId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (!count) {
      setError("You are not allowed to do that.");
      return;
    }

    if (isSelf) {
      router.push("/dashboard/boards");
    }
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
      >
        Members ({members.length})
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Members</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md px-2 text-xl text-muted hover:text-foreground"
              >
                &times;
              </button>
            </div>

            <ul className="space-y-2">
              {members.map((member) => {
                const name =
                  member.profiles?.display_name ?? member.profiles?.email;
                const isSelf = member.user_id === userId;

                return (
                  <li
                    key={member.user_id}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {name}
                        {isSelf && " (you)"}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {member.profiles?.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                      {member.role}
                    </span>

                    {member.role !== "owner" && isOwner && !isSelf && (
                      <button
                        type="button"
                        onClick={() => removeMember(member.user_id, false)}
                        className="rounded-md px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                      >
                        Remove
                      </button>
                    )}
                    {isSelf && member.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => removeMember(member.user_id, true)}
                        className="rounded-md px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                      >
                        Leave
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Invite people
              </h3>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted"
              />

              {searching && (
                <p className="mt-2 text-xs text-muted">Searching...</p>
              )}

              {!searching &&
                query.trim().length >= 2 &&
                results.length === 0 && (
                  <p className="mt-2 text-xs text-muted">No users found.</p>
                )}

              <ul className="mt-2 space-y-2">
                {results.map((profile) => {
                  const name = profile.display_name ?? profile.email;
                  const done = invited.includes(profile.id);

                  return (
                    <li
                      key={profile.id}
                      className="flex items-center gap-3 rounded-lg border p-2"
                    >
                      <Avatar name={name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {profile.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => invite(profile)}
                        disabled={done}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                      >
                        {done ? "Invited" : "Invite"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="mt-4 text-sm text-success">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
