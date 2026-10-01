"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, Lock, Mail, User, UserPlus } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthLayout from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/GoogleButton";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmation?: string }>({});
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setInfo("");
    const nextErrors: typeof errors = {};
    if (displayName.trim().length < 2) nextErrors.name = "Enter your name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (password.length < 6) nextErrors.password = "Use at least 6 characters for your password.";
    if (confirmation !== password) nextErrors.confirmation = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { display_name: displayName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setFormError(error.code === "user_already_exists"
          ? "An account with this email may already exist. Try signing in instead."
          : error.code === "weak_password"
            ? "Choose a stronger password and try again."
            : "Unable to create your account right now. Please try again.");
      } else if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setInfo("Your account is almost ready. Check your email for a confirmation link, then sign in.");
      }
    } catch {
      setFormError("Unable to create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Get your team organized and moving together.">
      {info ? (
        <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-5"><CheckCircle2 aria-hidden="true" className="mb-3 h-6 w-6 text-success" /><p className="font-semibold text-foreground">Check your inbox</p><p className="mt-2 text-sm leading-6 text-muted">{info}</p><Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Go to sign in</Link></div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField id="name" label="Your name" type="text" value={displayName} onChange={setDisplayName} icon={<User className="h-4 w-4" />} autoComplete="name" error={errors.name} />
          <AuthField id="email" label="Email address" type="email" value={email} onChange={setEmail} icon={<Mail className="h-4 w-4" />} autoComplete="email" error={errors.email} />
          <AuthField id="password" label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} icon={<Lock className="h-4 w-4" />} autoComplete="new-password" error={errors.password} trailing={<button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="rounded p-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</button>} />
          <AuthField id="confirm-password" label="Confirm password" type={showConfirmation ? "text" : "password"} value={confirmation} onChange={setConfirmation} icon={<Lock className="h-4 w-4" />} autoComplete="new-password" error={errors.confirmation} trailing={<button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"} aria-pressed={showConfirmation} className="rounded p-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">{showConfirmation ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</button>} />
          {formError && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">{formError}</p>}
                  <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65">{loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <UserPlus aria-hidden="true" className="h-4 w-4" />}{loading ? "Creating account..." : "Create account"}</button>
        </form>
      )}
      {!info && <><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div><GoogleButton label="Continue with Google" /></>}
      <p className="mt-7 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
