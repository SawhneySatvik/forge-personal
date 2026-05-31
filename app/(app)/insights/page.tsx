import { AnimatedNumber } from "@/components/fx/animated-number";
import { GlowCard } from "@/components/fx/glow-card";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Numeral } from "@/components/ui/stat";
import {
  consistencyScore30d,
  dsaByDifficulty,
  dsaByTopic,
  dsaCumulative,
  habitsCompletedByDay,
  perHabitStats,
  systemDesignCoverageOverTime,
  weeklyActivity,
} from "@/lib/analytics";
import { activeWindows } from "@/lib/challenges";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getActiveChallenges,
  getDailyLogsSince,
  getProfile,
  listDsaProblems,
  listSystemDesignTopics,
} from "@/lib/queries";
import {
  DsaCumulativeChart,
  DsaDifficultyChart,
  DsaTopicChart,
  SysDesignCoverageChart,
  WeeklyActivityChart,
} from "./_components/charts";

export default async function InsightsPage() {
  const profile = await getProfile();
  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);

  const [logs, problems, topics, challenges] = await Promise.all([
    getDailyLogsSince(addDays(today, -400)),
    listDsaProblems({ limit: 2000 }),
    listSystemDesignTopics(),
    getActiveChallenges(),
  ]);

  const windows = activeWindows(challenges);
  const consistency = consistencyScore30d(logs, today);
  const habitStats = perHabitStats(logs, today, windows);
  const weekly = weeklyActivity(logs, today, 8);
  const byDifficulty = dsaByDifficulty(problems);
  const byTopic = dsaByTopic(problems, 8);
  const cumulative = dsaCumulative(problems);
  const sdCoverage = systemDesignCoverageOverTime(topics);
  const aggByDay = habitsCompletedByDay(logs);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="How consistently you're showing up, and where the effort goes."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlowCard className="flex flex-col justify-center p-5">
          <p className="text-muted-foreground text-xs font-medium">
            30-day consistency
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatedNumber
              value={consistency}
              suffix="%"
              className="text-4xl font-semibold"
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Average completion across all five habits.
          </p>
        </GlowCard>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-5">
          {habitStats.map((s) => (
            <Card key={s.key}>
              <CardContent className="p-3">
                <p className="text-muted-foreground truncate text-[11px] font-medium">
                  {s.label}
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <AnimatedNumber value={s.current} className="text-xl font-semibold" />
                  <span className="text-muted-foreground text-[10px]">
                    {s.unit === "weeks" ? "wk" : "d"}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  best <Numeral>{s.longest}</Numeral>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <GlowCard className="p-4">
        <p className="text-muted-foreground mb-3 text-xs font-medium">
          Consistency — habits completed per day
        </p>
        <HabitHeatmap mode="count" valueByDay={aggByDay} max={5} endDay={today} />
      </GlowCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly activity</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChart data={weekly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">DSA by difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <DsaDifficultyChart data={byDifficulty} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top DSA topics</CardTitle>
          </CardHeader>
          <CardContent>
            {byTopic.length ? (
              <DsaTopicChart data={byTopic} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Log problems with topics to see this.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cumulative DSA solved</CardTitle>
          </CardHeader>
          <CardContent>
            {cumulative.length ? (
              <DsaCumulativeChart data={cumulative} />
            ) : (
              <p className="text-muted-foreground text-sm">No problems yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              System design topics covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sdCoverage.length ? (
              <SysDesignCoverageChart data={sdCoverage} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Mark topics covered to see this grow.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
