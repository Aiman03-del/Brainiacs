"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/confirm";

interface DeleteAccountFormProps {
  requirePassword: boolean;
}

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountForm({
  requirePassword,
}: DeleteAccountFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ready =
    confirmation === CONFIRM_WORD && (!requirePassword || password.length > 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !ready) return;
    setError("");

    const confirmed = await confirm({
      title: "Delete your account permanently?",
      description:
        "Your profile, settings and messages will be deleted. This cannot be undone.",
      confirmLabel: "Delete account",
      destructive: true,
    });
    if (!confirmed) return;

    setBusy(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, password }),
      });
      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "Unable to delete your account. Please try again.",
        );
        return;
      }

      try {
        await createClient().auth.signOut({ scope: "local" });
      } catch {
        // The session belongs to a deleted user and is already invalid.
      }
      toast.success("Your account has been deleted.");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to delete your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-danger p-5"
    >
      <div>
        <h3 className="text-base font-semibold text-danger">Delete account</h3>
        <p className="mt-1 text-sm text-muted">
          This permanently deletes your account and cannot be undone.
        </p>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Your profile, photo, settings and the messages you sent are deleted.</li>
        <li>
          Boards you own are handed to the member who has been there longest. Boards
          with no other members are deleted with all their tasks and messages.
        </li>
        <li>You are removed from every board you joined.</li>
      </ul>

      {requirePassword && (
        <div className="space-y-1.5">
          <label
            htmlFor="delete-password"
            className="block text-sm font-medium text-foreground"
          >
            Your password
          </label>
          <input
            id="delete-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={busy}
            className={fieldClass}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="delete-confirmation"
          className="block text-sm font-medium text-foreground"
        >
          Type {CONFIRM_WORD} to confirm
        </label>
        <input
          id="delete-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          disabled={busy}
          className={fieldClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="danger"
        disabled={!ready}
        loading={busy}
        leftIcon={<Trash2 aria-hidden="true" className="h-4 w-4" />}
      >
        Delete my account
      </Button>
    </form>
  );
}
