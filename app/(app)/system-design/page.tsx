import { HabitHeatmap } from "@/components/habit-heatmap";
import { PageHeader } from "@/components/page-header";
import { StreakStat } from "@/components/streak-stat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getDailyLogsSince,
  getProfile,
  habitRecords,
  listSystemDesignTopics,
} from "@/lib/queries";
import { systemDesignStreak } from "@/lib/streaks";
import type { DayKey } from "@/lib/types";
import { AddTopicForm } from "./_components/add-topic-form";
import { TopicRow } from "./_components/topic-row";

export default async function SystemDesignPage() {
  const profile = await getProfile();
  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);

  const [topics, logs] = await Promise.all([
    listSystemDesignTopics(),
    getDailyLogsSince(addDays(today, -364)),
  ]);

  const streak = systemDesignStreak(habitRecords(logs, "system_design"), today);
  const toCover = topics.filter((t) => !t.covered);
  const covered = topics.filter((t) => t.covered);

  const studiedByDay: Record<DayKey, number> = {};
  for (const r of habitRecords(logs, "system_design")) studiedByDay[r.day] = 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Design"
        description="One topic per evening. Check it off when you've covered it."
      />

      <StreakStat
        label="System design streak"
        result={streak}
        hint="One topic per evening"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Study activity</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitHeatmap
            mode="count"
            valueByDay={studiedByDay}
            max={1}
            endDay={today}
            legend={false}
          />
        </CardContent>
      </Card>

      <AddTopicForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">To cover ({toCover.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {toCover.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing queued. Add a topic above.
            </p>
          ) : (
            toCover.map((t) => <TopicRow key={t.id} topic={t} today={today} />)
          )}
        </CardContent>
      </Card>

      {covered.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Covered ({covered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {covered.map((t) => (
              <TopicRow key={t.id} topic={t} today={today} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
