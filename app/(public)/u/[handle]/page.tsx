import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getChecklistProgress,
  isChecklist,
  type ChecklistProgress,
} from "@/lib/challenges";
import {
  getPublicChallengeItems,
  getPublicChallengesForUser,
  getPublicProfile,
} from "@/lib/public-queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) return { title: "Forge" };
  const name = profile.display_name ?? `@${profile.handle}`;
  return { title: `${name} — Forge`, description: profile.bio ?? undefined };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) notFound();

  const challenges = await getPublicChallengesForUser(profile.user_id);

  const progressById: Record<string, ChecklistProgress> = {};
  await Promise.all(
    challenges.filter(isChecklist).map(async (c) => {
      progressById[c.id] = getChecklistProgress(
        await getPublicChallengeItems(c.id),
      );
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.display_name ?? `@${profile.handle}`}
        </h1>
        <p className="text-muted-foreground text-sm">@{profile.handle}</p>
        {profile.bio ? <p className="mt-3 text-sm">{profile.bio}</p> : null}
      </div>

      {challenges.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
          Nothing public yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((c) => {
            const p = progressById[c.id];
            return (
              <Link key={c.id} href={`/share/c/${c.id}`} className="block">
                <Card className="hover:ring-foreground/20 h-full transition-shadow">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{c.name}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Globe className="text-muted-foreground size-3.5" />
                        <Badge
                          variant={c.status === "Active" ? "default" : "outline"}
                        >
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                    {p ? (
                      <div className="space-y-1.5 pt-1">
                        <Progress value={p.percent} />
                        <p className="text-muted-foreground text-xs">
                          {p.done}/{p.total} solved · {p.percent}%
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        {challengeDates(c.start_date, c.end_date)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function challengeDates(start: string | null, end: string | null): string {
  if (!start) return "Challenge";
  return end ? `${start} → ${end}` : start;
}
