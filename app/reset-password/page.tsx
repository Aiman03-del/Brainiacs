import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=recovery");

  return (
    <AuthLayout title="Choose a new password" subtitle="Set a new password to secure your Brainiacs account.">
      <ResetPasswordForm />
    </AuthLayout>
  );
}