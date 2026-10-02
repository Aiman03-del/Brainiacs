"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Avatar from "@/components/Avatar";
import SignOutButton from "@/components/SignOutButton";
import { APP_NAVIGATION } from "@/lib/navigation";

interface AccountMenuProps {
  name: string;
  email: string;
  photoUrl: string | null;
  collapsed?: boolean;
}

const accountLinks = [
  ...(APP_NAVIGATION.find((group) => group.label === "Account")?.items ?? []),
  ...(APP_NAVIGATION.find((group) => group.label === "Utility")?.items.filter(
    (item) => item.label === "Settings",
  ) ?? []),
];

export default function AccountMenu({
  name,
  email,
  photoUrl,
  collapsed = false,
}: AccountMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activeHref = APP_NAVIGATION.flatMap((group) => group.items).find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)),
  )?.href;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Account options for ${name}`}
        aria-expanded={open}
        aria-controls="account-navigation-menu"
        title={collapsed ? `Account: ${name}` : undefined}
        className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeHref === "/dashboard/profile" ? "bg-surface-muted" : ""} ${collapsed ? "justify-center" : ""}`}
      >
        <Avatar name={name} src={photoUrl} size={32} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted">{email}</span>
            </span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          </>
        )}
      </button>

      {open && (
        <div
          id="account-navigation-menu"
          className={`absolute bottom-full z-50 mb-2 w-60 rounded-xl border border-border bg-surface p-2 shadow-lg ${collapsed ? "left-full ml-2" : "left-0"}`}
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <nav aria-label="Account navigation" className="py-1">
            {accountLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary ${activeHref === item.href ? "bg-surface-muted font-medium" : ""}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 text-muted" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border pt-1">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}