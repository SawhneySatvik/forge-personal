import { HabitHeatmap } from "@/components/habit-heatmap";
import { PageHeader } from "@/components/page-header";
import { StreakStat } from "@/components/streak-stat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Numeral } from "@/components/ui/stat";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getDailyLogsSince,
  getProfile,
  habitRecords,
} from "@/lib/queries";
import { gymStreak } from "@/lib/streaks";
import type { DayKey, GymStatus } from "@/lib/types";
import { GymDayControl } from "./_components/gym-day-control";

export default async function GymPage() {
  const profile = await getProfile();
  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);
  const logs = await getDailyLogsSince(addDays(today, -364));

  const streak = gymStreak(habitRecords(logs, "gym"), today);
  const todayStatus = logs.find((l) => l.date === today)?.gym_status ?? null;

  const statusByDay: Record<DayKey, GymStatus> = {};
  for (const l of logs) if (l.gym_status) statusByDay[l.date] = l.gym_status;

  const monthStart = `${today.slice(0, 8)}01`;
  const monthLogs = logs.filter((l) => l.date >= monthStart && l.date <= today);
  const wentCount = monthLogs.filter((l) => l.gym_status === "went").length;
  const restCount = monthLogs.filter((l) => l.gym_status === "rest").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gym"
        description="Went or didn't. A marked rest day keeps your streak alive."
      />

      <StreakStat
        label="Gym streak"
        result={streak}
        hint="Rest days bridge — an unlogged day breaks it"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <GymDayControl today={today} initial={todayStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 12 months</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitHeatmap mode="gym" statusByDay={statusByDay} endDay={today} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">
              This month — went
            </p>
            <Numeral className="mt-1 text-2xl font-semibold">
              {wentCount}
            </Numeral>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">
              This month — rest
            </p>
            <Numeral className="mt-1 text-2xl font-semibold">
              {restCount}
            </Numeral>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
