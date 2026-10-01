import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export default async function PublicHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="text-lg font-bold text-foreground">
            Brainiacs
          </Link>
          <nav className="flex flex-wrap items-center gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
