import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlowCard } from "@/components/fx/glow-card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { SdeProgress } from "@/components/sde-progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Numeral } from "@/components/ui/stat";
import {
  getChallengeProgress,
  getChallengeTracking,
  getChecklistProgress,
  isChecklist,
} from "@/lib/challenges";
import { todayInTz } from "@/lib/date";
import { DEFAULT_TIMEZONE } from "@/lib/queries";
import {
  getPublicChallenge,
  getPublicChallengeItems,
  getPublicChallengeLogs,
  itemDoneCountsByDay,
} from "@/lib/public-queries";
import type { DayKey } from "@/lib/types";
import { PublicChecklist } from "../../../_components/public-checklist";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getPublicChallenge(id);
  if (!challenge) return { title: "Forge" };
  return {
    title: `${challenge.name} — Forge`,
    description: challenge.description ?? "A challenge tracked on Forge.",
  };
}

export default async function PublicChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = await getPublicChallenge(id);
  if (!challenge) notFound();

  const today = todayInTz(DEFAULT_TIMEZONE);

  const header = (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {challenge.name}
        </h1>
        <Badge variant={challenge.status === "Active" ? "default" : "outline"}>
          {challenge.status}
        </Badge>
      </div>
      {challenge.description ? (
        <p className="text-muted-foreground mt-1 text-sm">
          {challenge.description}
        </p>
      ) : null}
    </div>
  );

  if (isChecklist(challenge)) {
    const items = await getPublicChallengeItems(challenge.id);
    const progress = getChecklistProgress(items);
    const valueByDay = itemDoneCountsByDay(items);

    return (
      <div className="space-y-6">
        {header}
        <GlowCard>
          <SdeProgress progress={progress} />
        </GlowCard>
        {Object.keys(valueByDay).length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solved per day</CardTitle>
            </CardHeader>
            <CardContent>
              <HabitHeatmap
                mode="count"
                valueByDay={valueByDay}
                max={5}
                endDay={today}
              />
            </CardContent>
          </Card>
        ) : null}
        <PublicChecklist items={items} />
      </div>
    );
  }

  // Cadence challenge — calendar progress + check-in heatmap.
  const logs = await getPublicChallengeLogs(challenge.id);
  const checkInDays = logs.filter((l) => l.done).map((l) => l.date);
  const progress = getChallengeProgress(challenge, today, []);
  const tracking = getChallengeTracking(challenge, today, checkInDays);
  const valueByDay: Record<DayKey, number> = {};
  for (const d of checkInDays) valueByDay[d] = 1;

  return (
    <div className="space-y-6">
      {header}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress.percentElapsed} />
          <p className="text-muted-foreground text-xs">
            <Numeral>{progress.percentElapsed}%</Numeral> elapsed ·{" "}
            <Numeral>{tracking.doneDays}</Numeral> days checked in ·{" "}
            <Numeral>{tracking.streak.count}</Numeral>-day streak
          </p>
        </CardContent>
      </Card>
      {checkInDays.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-in heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <HabitHeatmap
              mode="count"
              valueByDay={valueByDay}
              max={1}
              endDay={today}
              legend={false}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
