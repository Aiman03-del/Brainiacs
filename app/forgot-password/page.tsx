"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthLayout from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setFormError("We could not send a reset link right now. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setFormError("We could not send a reset link right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={sent ? "If there is an account for that address, a secure reset link is on its way." : "Enter the email address associated with your Brainiacs account."}
    >
      {sent ? (
        <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-5">
          <CheckCircle2 aria-hidden="true" className="mb-3 h-6 w-6 text-success" />
          <p className="font-semibold text-foreground">Reset link requested</p>
          <p className="mt-2 text-sm leading-6 text-muted">Check your inbox, including your spam folder, for the next step.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <AuthField id="email" label="Email address" type="email" value={email} onChange={setEmail} icon={<Mail className="h-4 w-4" />} autoComplete="email" error={emailError} />
          {formError && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">{formError}</p>}
          <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65">
            {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <KeyRound aria-hidden="true" className="h-4 w-4" />}
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      )}
      <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to sign in
      </Link>
    </AuthLayout>
  );
}