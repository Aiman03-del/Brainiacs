"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChangeEmailFormProps {
  currentEmail: string;
}

export default function ChangeEmailForm({ currentEmail }: ChangeEmailFormProps) {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setMessage("");

    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) {
      setError("Enter your new email address.");
      return;
    }
    if (nextEmail === currentEmail.toLowerCase()) {
      setError("This is already your email address.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser(
        { email: nextEmail },
        {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        },
      );

      if (updateError) {
        setError(
          updateError.message.toLowerCase().includes("already")
            ? "That email address is already in use."
            : "Unable to start the email change. Please try again.",
        );
        return;
      }

      setEmail("");
      setMessage(
        "Confirmation sent. Open the link in the email to finish the change. You may need to confirm from both your current and new inbox.",
      );
    } catch {
      setError("Unable to start the email change. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-y border-border py-5">
      <h3 className="text-base font-semibold text-foreground">Change email</h3>

      <div className="space-y-1.5">
        <label htmlFor="new-email" className="block text-sm font-medium text-foreground">
          New email address
        </label>
        <input
          id="new-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          disabled={busy}
          className={fieldClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" aria-live="polite" className="text-sm text-success">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email}
        className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Sending..." : "Send confirmation"}
      </button>
    </form>
  );
}
