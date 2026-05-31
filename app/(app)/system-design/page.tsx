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
import { AddTopicForm } from "./_components/add-topic-form";
import { TopicRow } from "./_components/topic-row";

export default async function SystemDesignPage() {
  const profile = await getProfile();
  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);

  const [topics, logs] = await Promise.all([
    listSystemDesignTopics(),
    getDailyLogsSince(addDays(today, -400)),
  ]);

  const streak = systemDesignStreak(habitRecords(logs, "system_design"), today);
  const toCover = topics.filter((t) => !t.covered);
  const covered = topics.filter((t) => t.covered);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Design</h1>
        <p className="text-muted-foreground text-sm">
          One topic per evening. Check it off when you&apos;ve covered it.
        </p>
      </div>

      <StreakStat
        label="System design streak"
        result={streak}
        hint="One topic per evening"
      />

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
