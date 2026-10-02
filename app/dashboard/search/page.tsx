import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlobalSearchPage } from "@/components/search/GlobalSearch";

export default async function SearchPage({
  searchParams,
}: PageProps<"/dashboard/search">) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <GlobalSearchPage initialQuery={Array.isArray(q) ? q[0] ?? "" : q ?? ""} />;
}