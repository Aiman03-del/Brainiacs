"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, Lock, LogIn, Mail, UserPlus } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthLayout from "@/components/auth/AuthLayout";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/GoogleButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setFormError(error.code === "email_not_confirmed"
          ? "Please confirm your email before signing in."
          : error.code === "invalid_credentials"
            ? "Email or password is incorrect."
            : "Unable to sign in right now. Please try again.");
        return;
      }
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      let destination = "/dashboard";
      if (requestedPath) {
        const target = new URL(requestedPath, window.location.origin);
        if (target.origin === window.location.origin && (target.pathname === "/dashboard" || target.pathname.startsWith("/dashboard/"))) {
          destination = `${target.pathname}${target.search}${target.hash}`;
        }
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setFormError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where your team left off.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField id="email" label="Email address" type="email" value={email} onChange={setEmail} icon={<Mail className="h-4 w-4" />} autoComplete="email" error={errors.email} />
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          icon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
          error={errors.password}
          trailing={<button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="rounded p-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</button>}
        />
        <div className="-mt-1 text-right"><Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
        {formError && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">{formError}</p>}
        <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65">
          {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogIn aria-hidden="true" className="h-4 w-4" />}{loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
      <GoogleButton label="Continue with Google" />
      <p className="mt-7 text-center text-sm text-muted">New to Brainiacs? <Link href="/signup" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><UserPlus aria-hidden="true" className="h-4 w-4" />Create an account</Link></p>
    </AuthLayout>
  );
}
