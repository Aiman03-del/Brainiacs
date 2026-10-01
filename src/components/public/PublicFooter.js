import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} Brainiacs. All rights reserved.</p>
        <nav className="flex gap-5">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
