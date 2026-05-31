import { BentoGrid, BentoItem } from "@/components/fx/bento-grid";
import { GlowCard } from "@/components/fx/glow-card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Numeral } from "@/components/ui/stat";
import { habitsCompletedByDay } from "@/lib/analytics";
import {
  activeWindows,
  getChallengeProgress,
  getChallengeTracking,
  getCurrentPhase,
} from "@/lib/challenges";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getActiveChallenges,
  getChallengeLogs,
  getDailyLogsSince,
  getProfile,
  getTodayDsaProblems,
  habitRecords,
} from "@/lib/queries";
import {
  dsaStreak,
  gymStreak,
  linkedinStreak,
  systemDesignStreak,
  xStreak,
} from "@/lib/streaks";
import { difficultyClass } from "@/lib/ui";
import { ChallengeDayControl } from "@/app/(app)/challenges/_components/challenge-day-control";
import { Checklist } from "./_components/checklist";
import { QuickLogDsa } from "./_components/quick-log-dsa";
import { StreakCards } from "./_components/streak-cards";

export default async function DashboardPage() {
  const profile = await getProfile();
  const tz = profile?.timezone ?? DEFAULT_TIMEZONE;
  const today = todayInTz(tz);
  const since = addDays(today, -400); // generous window for streak math

  const [logs, challenges, todayProblems] = await Promise.all([
    getDailyLogsSince(since),
    getActiveChallenges(),
    getTodayDsaProblems(today),
  ]);

  const todayLog = logs.find((l) => l.date === today) ?? null;
  const windows = activeWindows(challenges);
  const dsaDays = habitRecords(logs, "dsa").map((r) => r.day);

  const streaks = [
    {
      key: "dsa",
      label: "DSA",
      cadenceLabel: "Daily",
      result: dsaStreak(habitRecords(logs, "dsa"), today),
    },
    {
      key: "system_design",
      label: "System Design",
      cadenceLabel: "Daily",
      result: systemDesignStreak(habitRecords(logs, "system_design"), today),
    },
    {
      key: "gym",
      label: "Gym",
      cadenceLabel: "Rest days OK",
      result: gymStreak(habitRecords(logs, "gym"), today),
    },
    {
      key: "x",
      label: "X / Twitter",
      cadenceLabel: windows.length ? "Daily (challenge)" : "Weekly",
      result: xStreak(habitRecords(logs, "x"), today, windows),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      cadenceLabel: "Weekly",
      result: linkedinStreak(habitRecords(logs, "linkedin"), today),
    },
  ];

  const streakByKey = Object.fromEntries(
    streaks.map((s) => [
      s.key,
      {
        count: s.result.count,
        pendingCurrent: s.result.pendingCurrent,
        unit: s.result.unit,
      },
    ]),
  );

  const activeChallenge = challenges[0] ?? null;
  const phase = activeChallenge ? getCurrentPhase(activeChallenge, today) : null;
  const progress = activeChallenge
    ? getChallengeProgress(activeChallenge, today, dsaDays)
    : null;

  const activeChallengeLogs = activeChallenge
    ? await getChallengeLogs(activeChallenge.id)
    : [];
  const challengeCheckIns = activeChallengeLogs
    .filter((l) => l.done)
    .map((l) => l.date);
  const tracking = activeChallenge
    ? getChallengeTracking(activeChallenge, today, challengeCheckIns)
    : null;
  const challengeDoneToday = activeChallengeLogs.some(
    (l) => l.date === today && l.done,
  );

  const friendlyDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${today}T12:00:00Z`));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-muted-foreground text-sm">{friendlyDate}</p>
      </div>

      <StreakCards items={streaks} />

      {activeChallenge && progress ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{activeChallenge.name}</CardTitle>
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
                </span>{" "}
                <span className="text-muted-foreground">
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
                Outside the active phase window.
              </p>
            )}
            <Progress value={progress.percentElapsed} />
            <p className="text-muted-foreground text-xs">
              <Numeral>{progress.percentElapsed}%</Numeral> elapsed ·{" "}
              <Numeral>{progress.topicsCovered}</Numeral> active days logged
            </p>
            {tracking ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <p className="text-muted-foreground text-xs">
                  <Numeral>{tracking.streak.count}</Numeral>-day check-in streak ·{" "}
                  <Numeral>{tracking.doneDays}</Numeral>/
                  <Numeral>{tracking.daysElapsedInWindow}</Numeral> days done
                </p>
                <ChallengeDayControl
                  challengeId={activeChallenge.id}
                  today={today}
                  initialDone={challengeDoneToday}
                  streakCount={tracking.streak.count}
                  pendingToday={tracking.streak.pendingCurrent}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <BentoGrid>
        <BentoItem span={6} className="sm:col-span-2">
          <GlowCard className="h-full p-4">
            <p className="text-muted-foreground mb-3 text-xs font-medium">
              Consistency — habits completed per day
            </p>
            <HabitHeatmap
              mode="count"
              valueByDay={habitsCompletedByDay(logs)}
              max={5}
              endDay={today}
            />
          </GlowCard>
        </BentoItem>
        <BentoItem span={3}>
          <Checklist
            today={today}
            streaks={streakByKey}
            initial={{
              dsa: todayLog?.dsa_done ?? false,
              system_design: todayLog?.system_design_done ?? false,
              x: todayLog?.posted_x ?? false,
              linkedin: todayLog?.posted_linkedin ?? false,
              gym: todayLog?.gym_status ?? null,
            }}
          />
        </BentoItem>
        <BentoItem span={3}>
          <QuickLogDsa today={today} challengeId={activeChallenge?.id ?? null} />
        </BentoItem>
      </BentoGrid>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Logged today (<Numeral>{todayProblems.length}</Numeral>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayProblems.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing logged yet. Use the quick-log form above.
            </p>
          ) : (
            <ul className="divide-y">
              {todayProblems.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.problem_url ? (
                        <a
                          href={p.problem_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-4 hover:underline"
                        >
                          {p.name}
                        </a>
                      ) : (
                        p.name
                      )}
                    </p>
                    {p.topic ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {p.topic}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.difficulty ? (
                      <span
                        className={`text-xs font-medium ${difficultyClass(p.difficulty)}`}
                      >
                        {p.difficulty}
                      </span>
                    ) : null}
                    <Badge variant={p.solved ? "default" : "outline"}>
                      {p.solved ? "Solved" : "Attempted"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
