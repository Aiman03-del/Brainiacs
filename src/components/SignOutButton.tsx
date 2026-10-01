"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) await supabase.auth.signOut({ scope: "local" });
    } catch {
      try {
        await createClient().auth.signOut({ scope: "local" });
      } catch {
        // Navigation still leaves the protected page if sign-out is unavailable.
      }
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
    >
      <LogOut aria-hidden="true" className="h-4 w-4 text-muted" />
      Sign out
    </button>
  );
}
