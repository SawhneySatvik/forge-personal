import { PageHeader } from "@/components/page-header";
import { getProfile, listChallenges } from "@/lib/queries";
import { ProfileForm } from "./_components/profile-form";
import { SharingCard } from "./_components/sharing-card";

export default async function SettingsPage() {
  const [profile, challenges] = await Promise.all([
    getProfile(),
    listChallenges(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile, timezone, linked accounts, and sharing."
      />
      <ProfileForm initial={profile} />
      <SharingCard
        handle={profile?.public_handle ?? null}
        bio={profile?.public_bio ?? null}
        isPublic={profile?.is_public ?? false}
        challenges={challenges.map((c) => ({
          id: c.id,
          name: c.name,
          is_public: c.is_public,
        }))}
      />
    </div>
  );
}
