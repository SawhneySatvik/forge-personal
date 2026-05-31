import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuickLogDsa } from "@/app/(app)/dashboard/_components/quick-log-dsa";
import { GlowCard } from "@/components/fx/glow-card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { PageHeader } from "@/components/page-header";
import { SdeProgress } from "@/components/sde-progress";
import { SyncLeetcodeButton } from "@/components/sync-leetcode-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChecklistProgress, isChecklist } from "@/lib/challenges";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getActiveChallenges,
  getChallengeItems,
  getDsaHeatmap,
  getProfile,
  listDsaProblems,
} from "@/lib/queries";
import type { Difficulty } from "@/lib/types";
import { DsaFilters } from "./_components/dsa-filters";
import { DsaTable } from "./_components/dsa-table";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function asDifficulty(value: string | undefined): Difficulty | undefined {
  return value === "Easy" || value === "Medium" || value === "Hard"
    ? value
    : undefined;
}

export default async function DsaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" ? sp.topic : undefined;
  const difficulty = asDifficulty(
    typeof sp.difficulty === "string" ? sp.difficulty : undefined,
  );
  const solvedOnly = sp.solved === "1";

  const [profile, problems, challenges] = await Promise.all([
    getProfile(),
    listDsaProblems({ topic, difficulty, solvedOnly }),
    getActiveChallenges(),
  ]);

  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);
  const checklist = challenges.find(isChecklist) ?? null;
  const cadence = challenges.find((c) => !isChecklist(c)) ?? null;

  const items = checklist ? await getChallengeItems(checklist.id) : [];
  const checklistProgress = checklist ? getChecklistProgress(items) : null;
  const sheetItems = items
    .filter((i) => !i.done)
    .map((i) => ({
      id: i.id,
      title: i.title,
      url: i.url,
      difficulty: i.difficulty,
      section: i.section,
    }));

  const countsByDay = await getDsaHeatmap(addDays(today, -364));

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSA log"
        description="Pick from the SDE sheet or free-log anything. Newest first."
      />

      {checklist && checklistProgress ? (
        <GlowCard>
          <div className="flex items-center justify-between gap-2 px-5 pt-4">
            <CardTitle className="text-base">{checklist.name}</CardTitle>
            <Link
              href={`/challenges/${checklist.id}`}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
              Open sheet <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <SdeProgress progress={checklistProgress} className="pt-3" />
        </GlowCard>
      ) : null}

      <QuickLogDsa
        today={today}
        challengeId={cadence?.id ?? null}
        sheetItems={sheetItems}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Activity</CardTitle>
            <SyncLeetcodeButton variant="ghost" />
          </div>
        </CardHeader>
        <CardContent>
          <HabitHeatmap mode="count" valueByDay={countsByDay} endDay={today} />
        </CardContent>
      </Card>

      <DsaFilters initial={{ topic, difficulty, solvedOnly }} />

      <DsaTable problems={problems} />
    </div>
  );
}
