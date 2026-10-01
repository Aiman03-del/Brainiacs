"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";

export default function PublicNav({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const entryHref = isAuthenticated ? "/dashboard" : "/signup";
  const entryLabel = isAuthenticated ? "Open Dashboard" : "Get Started";

  return (
    <nav aria-label="Public navigation" className="relative">
      <div className="hidden items-center gap-7 md:flex">
        <Link
          href="/#features"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Features
        </Link>
        {!isAuthenticated && (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Sign In
          </Link>
        )}
        <Link
          href={entryHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {entryLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      <div className="md:hidden">
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
        {menuOpen && (
          <div
            id="public-mobile-menu"
            className="absolute right-0 top-full z-30 mt-3 w-64 rounded-xl border bg-surface p-3 shadow-xl"
          >
            <Link
              href="/#features"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Features
            </Link>
            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Sign In
              </Link>
            )}
            <Link
              href={entryHref}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {entryLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}