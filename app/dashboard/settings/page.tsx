import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, photo_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <ProfileForm
        userId={user.id}
        profile={{
          display_name: profile?.display_name ?? "",
          email: profile?.email ?? user.email ?? "",
          photo_url: profile?.photo_url ?? null,
        }}
      />

      <PasswordForm />
    </div>
  );
}
