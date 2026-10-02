"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

interface PasswordFormProps {
  email: string;
  requireCurrent: boolean;
}

export default function PasswordForm({ email, requireCurrent }: PasswordFormProps) {
  const [supabase] = useState(() => createClient());
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setMessage("");

    if (requireCurrent && !current) {
      setError("Enter your current password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (requireCurrent && password === current) {
      setError("Your new password must be different from the current one.");
      return;
    }

    setBusy(true);
    try {
      if (requireCurrent) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        });
        if (verifyError) {
          setError("Your current password is incorrect.");
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError("Unable to update your password. Please try again.");
        return;
      }

      setCurrent("");
      setPassword("");
      setConfirm("");
      setMessage(requireCurrent ? "Password updated." : "Password set.");
    } catch {
      setError("Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-y border-border py-5"
    >
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {requireCurrent ? "Change password" : "Set a password"}
        </h3>
        {!requireCurrent && (
          <p className="mt-1 text-xs text-muted">
            You currently sign in without a password. Set one to also log in with your email.
          </p>
        )}
      </div>

      {requireCurrent && (
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="block text-sm font-medium text-foreground">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            required
            disabled={busy}
            className={fieldClass}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          disabled={busy}
          className={fieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          minLength={8}
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
        disabled={busy || !password || !confirm || (requireCurrent && !current)}
        className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Updating..." : requireCurrent ? "Update password" : "Set password"}
      </button>
    </form>
  );
}
