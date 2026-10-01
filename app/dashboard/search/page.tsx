import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage({
  searchParams,
}: PageProps<"/dashboard/search">) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Search</h1>
      <form action="/dashboard/search" className="mt-5 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search workspace"
          aria-label="Search workspace"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Search
        </button>
      </form>
      <div className="mt-6 rounded-xl border border-dashed p-6 text-sm text-muted">
        {q
          ? `Workspace-wide search is not available yet. No results were queried for “${q}”.`
          : "Workspace-wide search across channels, messages, and tasks is not available yet."}
        <p className="mt-3">
          <Link href="/dashboard/boards" className="font-medium text-primary">
            Browse channels
          </Link>
        </p>
      </div>
    </div>
  );
}