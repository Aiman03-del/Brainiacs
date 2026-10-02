"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title: string;
  description: string;
}

export function ErrorState({ title, description }: ErrorStateProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section
      role="alert"
      className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-border bg-surface p-8 text-center"
    >
      <CircleAlert aria-hidden="true" className="h-7 w-7 text-danger" />
      <h2 className="mt-3 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <Button
        variant="outline"
        size="sm"
        loading={pending}
        leftIcon={<RotateCw aria-hidden="true" className="h-4 w-4" />}
        className="mt-5"
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Trying again..." : "Try again"}
      </Button>
    </section>
  );
}