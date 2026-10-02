import { redirect } from "next/navigation";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/lib/settings";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import ChangeEmailForm from "@/components/settings/ChangeEmailForm";
import AppearanceForm from "@/components/settings/AppearanceForm";
import NotificationsForm from "@/components/settings/NotificationsForm";
import PrivacyForm from "@/components/settings/PrivacyForm";
import SignOutAllButton from "@/components/settings/SignOutAllButton";
import SettingsNavigation from "@/components/settings/SettingsNavigation";
import SignOutButton from "@/components/SignOutButton";

const providerLabels: Record<string, string> = {
  email: "Email and password",
  google: "Google",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, settingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, photo_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_settings")
      .select("notify_invites, notify_task_reminders, allow_invites")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const profileError = profileResult.error;
  const settings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    ...(settingsResult.data ?? {}),
  };

  const providers: string[] = user.identities?.length
    ? user.identities.map((identity) => identity.provider)
    : (user.app_metadata?.providers ?? []);
  const hasPasswordLogin = providers.includes("email");
  const accountEmail = profile?.email ?? user.email ?? "";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="text-sm font-medium text-muted">Manage your account</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your profile, appearance, notifications, privacy and account security.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <SettingsNavigation />
        </aside>

        <div className="min-w-0 space-y-10">
          <section
            id="account"
            aria-labelledby="account-title"
            className="scroll-mt-24 space-y-4"
          >
            <div>
              <h2 id="account-title" className="text-lg font-semibold text-foreground">
                Account
              </h2>
              <p className="mt-1 text-sm text-muted">
                Personal details and the email connected to your account.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                  <Mail aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {accountEmail || "Email not available"}
                  </p>
                  <p className="text-xs text-muted">Sign-in email</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                {user.email_confirmed_at ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
                    Verified
                  </>
                ) : (
                  <>
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                    Verification pending
                  </>
                )}
              </span>
            </div>

            {profileError && (
              <p role="alert" className="text-sm text-danger">
                Unable to load saved profile details. You can still update them below.
              </p>
            )}

            <ProfileForm
              userId={user.id}
              profile={{
                display_name: profile?.display_name ?? "",
                email: profile?.email ?? user.email ?? "",
                photo_url: profile?.photo_url ?? null,
              }}
            />
          </section>

          <section
            id="appearance"
            aria-labelledby="appearance-title"
            className="scroll-mt-24 space-y-4 border-t border-border pt-8"
          >
            <div>
              <h2 id="appearance-title" className="text-lg font-semibold text-foreground">
                Appearance
              </h2>
              <p className="mt-1 text-sm text-muted">
                Choose how Brainiacs looks on this device.
              </p>
            </div>
            <AppearanceForm />
          </section>

          <section
            id="notifications"
            aria-labelledby="notifications-title"
            className="scroll-mt-24 space-y-4 border-t border-border pt-8"
          >
            <div>
              <h2 id="notifications-title" className="text-lg font-semibold text-foreground">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-muted">
                Choose which pop-up alerts you see while using Brainiacs.
              </p>
            </div>
            <NotificationsForm userId={user.id} initial={settings} />
          </section>

          <section
            id="privacy"
            aria-labelledby="privacy-title"
            className="scroll-mt-24 space-y-4 border-t border-border pt-8"
          >
            <div>
              <h2 id="privacy-title" className="text-lg font-semibold text-foreground">
                Privacy
              </h2>
              <p className="mt-1 text-sm text-muted">
                Control who can add you to their boards.
              </p>
            </div>
            <PrivacyForm userId={user.id} initial={settings} />
          </section>

          <section
            id="security"
            aria-labelledby="security-title"
            className="scroll-mt-24 space-y-4 border-t border-border pt-8"
          >
            <div>
              <h2 id="security-title" className="text-lg font-semibold text-foreground">
                Security
              </h2>
              <p className="mt-1 text-sm text-muted">
                Manage how you sign in and where you are signed in.
              </p>
            </div>

            <div className="border-y border-border py-3">
              <p className="text-sm font-medium text-foreground">Sign-in methods</p>
              <ul className="mt-2 space-y-1.5">
                {providers.map((provider) => (
                  <li key={provider} className="flex items-center gap-2 text-sm text-muted">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
                    {providerLabels[provider] ??
                      provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </li>
                ))}
              </ul>
            </div>

            <PasswordForm email={accountEmail} requireCurrent={hasPasswordLogin} />

            {hasPasswordLogin && <ChangeEmailForm currentEmail={accountEmail} />}

            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out</p>
                <p className="mt-0.5 text-xs text-muted">
                  End your current Brainiacs session on this device.
                </p>
              </div>
              <SignOutButton />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out of all devices</p>
                <p className="mt-0.5 text-xs text-muted">
                  Useful if you lost a device or signed in on a shared computer.
                </p>
              </div>
              <SignOutAllButton />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
