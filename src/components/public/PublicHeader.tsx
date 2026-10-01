import { createClient } from "@/lib/supabase/server";
import BrandMark from "@/components/public/BrandMark";
import PublicNav from "@/components/public/PublicNav";

export default async function PublicHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="relative z-20 border-b bg-surface">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <PublicNav isAuthenticated={Boolean(user)} />
      </div>
    </header>
  );
}
