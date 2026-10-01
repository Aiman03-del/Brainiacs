"use client";

import { createClient } from "@/lib/supabase/client";

interface GoogleButtonProps {
  label?: string;
}

export default function GoogleButton({
  label = "Continue with Google",
}: GoogleButtonProps) {
  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      className="w-full rounded-lg border border-border bg-surface px-4 py-2 font-medium text-foreground hover:bg-surface-hover"
    >
      {label}
    </button>
  );
}
