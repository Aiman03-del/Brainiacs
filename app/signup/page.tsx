"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/GoogleButton";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account, then log in.");
      }
    } catch {
      setError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-surface p-8 shadow">
        <h1 className="text-2xl font-bold">Create your account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Full name"
            aria-label="Full name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <input
            type="email"
            required
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
          />

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="text-sm text-success">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="text-center text-sm text-muted">or</div>
        <GoogleButton label="Sign up with Google" />

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
