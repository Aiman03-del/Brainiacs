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
    <div className="mx-auto h-[calc(100dvh-8.5rem)] min-h-[28rem] max-w-5xl">
      <AiChat />
    </div>
  );
}
