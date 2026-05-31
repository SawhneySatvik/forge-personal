import { notFound } from "next/navigation";
import { GlowCard } from "@/components/fx/glow-card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { SdeProgress } from "@/components/sde-progress";
import { StreakStat } from "@/components/streak-stat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Numeral } from "@/components/ui/stat";
import {
  challengeWindow,
  getChallengeProgress,
  getChallengeTracking,
  getChecklistProgress,
  getCurrentPhase,
  isChecklist,
  totalDays,
} from "@/lib/challenges";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getChallenge,
  getChallengeItems,
  getChallengeLogs,
  getDailyLogsSince,
  getProfile,
  habitRecords,
} from "@/lib/queries";
import type { DayKey } from "@/lib/types";
import { ChallengeControls } from "../_components/challenge-controls";
import { ChallengeDayControl } from "../_components/challenge-day-control";
import { ChallengeTimeline } from "../_components/challenge-timeline";
import { SdeChecklist, type ChecklistRow } from "./_components/sde-checklist";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, challenge] = await Promise.all([getProfile(), getChallenge(id)]);
  if (!challenge) notFound();

  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
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
        {challenge.start_date ? (
          <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
            {challenge.start_date}
            {challenge.end_date ? ` → ${challenge.end_date}` : ""}
          </p>
        ) : null}
      </div>
      <ChallengeControls
        id={challenge.id}
        status={challenge.status}
        isPublic={challenge.is_public}
      />
    </div>
  );

  // ---- Checklist challenges (e.g. the SDE Sheet): items-done progress ----
  if (isChecklist(challenge)) {
    const items = await getChallengeItems(challenge.id);
    const progress = getChecklistProgress(items);
    const rows: ChecklistRow[] = items.map((it) => ({
      id: it.id,
      section: it.section,
      title: it.title,
      difficulty: it.difficulty,
      url: it.url,
      source: it.source,
      done: it.done,
    }));
    const valueByDay: Record<DayKey, number> = {};
    for (const it of items) {
      if (it.done && it.done_date)
        valueByDay[it.done_date] = (valueByDay[it.done_date] ?? 0) + 1;
    }

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
        <SdeChecklist items={rows} />
      </div>
    );
  }

  // ---- Cadence challenges: daily check-ins (existing behavior) ----
  const [logs, checkLogs] = await Promise.all([
    getDailyLogsSince(addDays(today, -400)),
    getChallengeLogs(challenge.id),
  ]);

  const dsaDays = habitRecords(logs, "dsa").map((r) => r.day);
  const progress = getChallengeProgress(challenge, today, dsaDays);
  const phase = getCurrentPhase(challenge, today);

  const checkInDays = checkLogs.filter((l) => l.done).map((l) => l.date);
  const tracking = getChallengeTracking(challenge, today, checkInDays);
  const doneToday = checkLogs.some((l) => l.date === today && l.done);

  const win = challengeWindow(challenge);
  const heatEnd = win && win.end < today ? win.end : today;
  const heatWeeks = Math.max(8, Math.ceil(totalDays(challenge) / 7) + 1);
  const checkValueByDay: Record<DayKey, number> = {};
  for (const d of checkInDays) checkValueByDay[d] = 1;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2">
        <StreakStat
          label="Check-in streak"
          result={tracking.streak}
          hint={`${tracking.completionPercent}% of elapsed days`}
        />
        <Card>
          <CardContent className="flex h-full flex-col items-start justify-between gap-3 p-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Today&apos;s check-in
              </p>
              <p className="mt-1 text-sm">
                {doneToday ? "Checked in for today ✓" : "Not checked in yet"}
              </p>
            </div>
            <ChallengeDayControl
              challengeId={challenge.id}
              today={today}
              initialDone={doneToday}
              streakCount={tracking.streak.count}
              pendingToday={tracking.streak.pendingCurrent}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Progress</CardTitle>
            <Badge variant="secondary" className="font-mono tabular-nums">
              Day {Math.min(progress.daysElapsed, progress.totalDays)} /{" "}
              {progress.totalDays}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {phase ? (
            <p className="text-sm">
              <span className="font-medium">
                Phase {phase.phaseIndex + 1}: {phase.phase.name}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · Day {phase.dayWithinPhase}/{phase.phase.duration_days}
              </span>
              {phase.topicForToday ? (
                <>
                  {" "}
                  · Today:{" "}
                  <span className="font-medium">{phase.topicForToday}</span>
                </>
              ) : null}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {progress.daysElapsed >= progress.totalDays && progress.totalDays > 0
                ? "Challenge complete — every day has elapsed."
                : "Not started yet."}
            </p>
          )}
          <Progress value={progress.percentElapsed} />
          <p className="text-muted-foreground text-xs">
            <Numeral>{progress.percentElapsed}%</Numeral> elapsed ·{" "}
            <Numeral>{tracking.doneDays}</Numeral>/
            <Numeral>{tracking.daysElapsedInWindow}</Numeral> days checked in
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-in heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitHeatmap
            mode="count"
            valueByDay={checkValueByDay}
            max={1}
            endDay={heatEnd}
            weeks={heatWeeks}
            legend={false}
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium">Phases</h2>
        <ChallengeTimeline challenge={challenge} today={today} />
      </div>
    </div>
  );
}
