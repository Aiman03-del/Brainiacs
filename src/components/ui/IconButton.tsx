"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: "default" | "danger";
}

export function IconButton({
  label,
  icon,
  variant = "default",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variant === "danger"
          ? "text-danger hover:bg-danger-soft"
          : "text-muted hover:bg-surface-hover hover:text-foreground",
        className,
      )}
    >
      {icon}
    </button>
  );
}