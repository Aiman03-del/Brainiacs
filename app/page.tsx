import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Brainiacs</h1>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover">
          Log in
        </Link>
        <Link href="/signup" className="rounded-lg border border-border px-4 py-2 hover:bg-surface-hover">
          Sign up
        </Link>
      </div>
    </main>
  );
}
