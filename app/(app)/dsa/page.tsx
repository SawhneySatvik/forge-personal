import { QuickLogDsa } from "@/app/(app)/dashboard/_components/quick-log-dsa";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getActiveChallenges,
  getDsaCountsByDay,
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
  const activeChallenge = challenges[0] ?? null;
  const countsByDay = await getDsaCountsByDay(addDays(today, -364));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DSA log</h1>
        <p className="text-muted-foreground text-sm">
          Every problem you&apos;ve logged, newest first.
        </p>
      </div>

      <QuickLogDsa today={today} challengeId={activeChallenge?.id ?? null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
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
