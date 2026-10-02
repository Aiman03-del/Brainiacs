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
    <div className="mx-auto h-[calc(100dvh-6rem)] min-h-0 max-w-5xl sm:h-[calc(100dvh-7rem)] sm:min-h-96">
      <AiChat />
    </div>
  );
}
