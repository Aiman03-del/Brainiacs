"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, Lock, LogIn } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [formError, setFormError] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const nextErrors: typeof errors = {};
    if (password.length < 6) nextErrors.password = "Use at least 6 characters for your password.";
    if (confirmation !== password) nextErrors.confirmation = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError("We could not update your password. Please request a new reset link.");
      } else {
        setComplete(true);
      }
    } catch {
      setFormError("We could not update your password. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (complete) {
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-5">
        <CheckCircle2 aria-hidden="true" className="mb-3 h-6 w-6 text-success" />
        <p className="font-semibold text-foreground">Password updated</p>
        <p className="mt-2 text-sm leading-6 text-muted">Your new password is ready to use.</p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          Continue to Brainiacs <LogIn aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AuthField id="password" label="New password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} icon={<Lock className="h-4 w-4" />} autoComplete="new-password" error={errors.password} trailing={<button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="rounded p-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</button>} />
      <AuthField id="confirm-password" label="Confirm new password" type={showConfirmation ? "text" : "password"} value={confirmation} onChange={setConfirmation} icon={<Lock className="h-4 w-4" />} autoComplete="new-password" error={errors.confirmation} trailing={<button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"} aria-pressed={showConfirmation} className="rounded p-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">{showConfirmation ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</button>} />
      {formError && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">{formError}</p>}
      <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65">
        {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Lock aria-hidden="true" className="h-4 w-4" />}{loading ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}