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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
        <p className="text-muted-foreground text-sm">
          Your GitHub and LeetCode activity. Set usernames in Settings, then
          Refresh.
        </p>
      </div>

      <SocialLinks
        x={profile?.x_handle ?? null}
        linkedin={profile?.linkedin_url ?? null}
      />

      <GithubCard snapshot={gh} hasUsername={!!profile?.github_username} />
      <LeetcodeCard snapshot={lc} hasUsername={!!profile?.leetcode_username} />
    </div>
  );
}
