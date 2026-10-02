"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/confirm";

export default function SignOutAllButton() {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;

    const confirmed = await confirm({
      title: "Sign out of all devices?",
      description:
        "You will be signed out everywhere, including this device. You will need to log in again.",
      confirmLabel: "Sign out everywhere",
      destructive: true,
    });
    if (!confirmed) return;

    setBusy(true);
    try {
      const { error } = await createClient().auth.signOut({ scope: "global" });
      if (error) {
        toast.error("Unable to sign out of all devices. Please try again.");
        setBusy(false);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out of all devices. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      loading={busy}
      leftIcon={<LogOut aria-hidden="true" className="h-4 w-4" />}
    >
      Sign out everywhere
    </Button>
  );
}
