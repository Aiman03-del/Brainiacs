import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AiChat from "@/components/ai/AiChat";

export default async function AiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto h-[calc(100vh-8.5rem)] max-w-3xl overflow-hidden rounded-2xl border bg-surface">
      <AiChat />
    </div>
  );
}
