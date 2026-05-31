import { PageHeader } from "@/components/page-header";
import { SyncLeetcodeButton } from "@/components/sync-leetcode-button";
import { getLatestSnapshot, getProfile } from "@/lib/queries";
import type { GithubSnapshot, LeetcodeSnapshot } from "@/lib/types";
import { GithubCard } from "./_components/github-card";
import { LeetcodeCard } from "./_components/leetcode-card";
import { SocialLinks } from "./_components/social-links";

export default async function ProfilesPage() {
  const [profile, gh, lc] = await Promise.all([
    getProfile(),
    getLatestSnapshot<GithubSnapshot>("github"),
    getLatestSnapshot<LeetcodeSnapshot>("leetcode"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profiles"
        description="Your GitHub and LeetCode activity. Set usernames in Settings, then Refresh."
      >
        <SyncLeetcodeButton />
      </PageHeader>

      <SocialLinks
        x={profile?.x_handle ?? null}
        linkedin={profile?.linkedin_url ?? null}
      />

      <GithubCard snapshot={gh} hasUsername={!!profile?.github_username} />
      <LeetcodeCard snapshot={lc} hasUsername={!!profile?.leetcode_username} />
    </div>
  );
}
