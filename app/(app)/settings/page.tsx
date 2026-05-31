import { getProfile } from "@/lib/queries";
import { ProfileForm } from "./_components/profile-form";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Your profile, timezone, and linked accounts.
        </p>
      </div>
      <ProfileForm initial={profile} />
    </div>
  );
}
