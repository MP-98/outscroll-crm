import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Profile · Settings" };

export default async function ProfileSettingsPage() {
  const profile = await requireProfile();
  return (
    <section className="max-w-lg space-y-8">
      <div className="space-y-4">
        <header>
          <h2 className="text-base font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground">How you appear across the workspace.</p>
        </header>
        <ProfileForm
          initial={{
            full_name: profile.full_name ?? "",
            email: profile.email ?? "",
            avatar_url: profile.avatar_url,
            role: profile.role,
          }}
        />
      </div>
      <div className="space-y-4">
        <header>
          <h2 className="text-base font-semibold">Password</h2>
          <p className="text-xs text-muted-foreground">
            Change your sign-in password. Minimum 8 characters.
          </p>
        </header>
        <PasswordForm />
      </div>
    </section>
  );
}
