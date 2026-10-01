"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import AccountMenu from "@/components/app/AccountMenu";
import AppNavigation from "@/components/app/AppNavigation";
import Avatar from "@/components/Avatar";
import InvitesBell from "@/components/InvitesBell";
import type { BoardInvite } from "@/types";
import { findNavigationItem } from "@/lib/navigation";

interface AuthenticatedAppShellProps {
  children: ReactNode;
  userId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  initialInvites: BoardInvite[];
}

export default function AuthenticatedAppShell({
  children,
  userId,
  name,
  email,
  photoUrl,
  initialInvites,
}: AuthenticatedAppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeItem = findNavigationItem(pathname);

  useEffect(() => {
    if (mobileOpen) closeButtonRef.current?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const closeMobileNavigation = () => {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  };

  const handleDrawerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface px-3 py-4 transition-[width] duration-200 lg:flex ${collapsed ? "w-19" : "w-64"}`}
      >
        <div className={`mb-7 flex min-h-10 items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
          <Link
            href="/dashboard"
            aria-label="Brainiacs dashboard"
            className="flex min-w-0 items-center gap-2 rounded-md text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <BrainCircuit aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
            {!collapsed && <span className="truncate text-lg font-bold">Brainiacs</span>}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="mb-4 self-center rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
          </button>
        )}

        <AppNavigation collapsed={collapsed} />

        <div className={`mt-auto border-t border-border pt-3 ${collapsed ? "flex justify-center" : ""}`}>
          <AccountMenu name={name} email={email} photoUrl={photoUrl} collapsed={collapsed} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-app-navigation"
              className="rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <BrainCircuit aria-hidden="true" className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Brainiacs</span>
            </Link>
            <p className="hidden truncate text-sm font-semibold text-foreground lg:block">
              {activeItem?.label ?? "Workspace"}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/dashboard/search"
              aria-label="Search"
              title="Search"
              className="rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </Link>
            <InvitesBell userId={userId} initialInvites={initialInvites} />
            <Link
              href="/dashboard/profile"
              aria-label={`Open profile for ${name}`}
              title="Profile"
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Avatar name={name} src={photoUrl} size={32} />
            </Link>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileNavigation}
            className="absolute inset-0 h-full w-full bg-overlay"
          />
          <aside
            id="mobile-app-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Application navigation"
            onKeyDown={handleDrawerKeyDown}
            className="relative flex h-full w-80 max-w-[calc(100vw-3rem)] flex-col border-r border-border bg-surface px-4 py-4 shadow-xl"
          >
            <div className="mb-6 flex min-h-10 items-center justify-between">
              <Link href="/dashboard" onClick={closeMobileNavigation} className="flex items-center gap-2 font-semibold text-foreground">
                <BrainCircuit aria-hidden="true" className="h-6 w-6 text-primary" />Brainiacs
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobileNavigation}
                aria-label="Close navigation menu"
                className="rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <AppNavigation mobile onNavigate={closeMobileNavigation} />
            <div className="mt-auto border-t border-border pt-3">
              <AccountMenu name={name} email={email} photoUrl={photoUrl} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}