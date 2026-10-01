import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import BrandMark from "@/components/public/BrandMark";

export default function PublicFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr]">
          <div className="max-w-sm">
            <BrandMark />
            <p className="mt-4 text-sm leading-6 text-muted">
              A shared workspace for team communication, tasks, AI assistance,
              and the progress in between.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Product</h2>
            <nav aria-label="Product links" className="mt-3 flex flex-col gap-2.5">
              <Link href="/#features" className="text-sm text-muted hover:text-foreground">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-muted hover:text-foreground">
                Pricing
              </Link>
              <Link href="/about" className="text-sm text-muted hover:text-foreground">
                About
              </Link>
              <Link href="/faq" className="text-sm text-muted hover:text-foreground">
                FAQ & help
              </Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Get started</h2>
            <nav aria-label="Account links" className="mt-3 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
              >
                Get Started
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-9 border-t pt-5 text-xs text-muted">
          &copy; {new Date().getFullYear()} Brainiacs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
