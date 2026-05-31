import { StreakStat } from "@/components/streak-stat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activeWindows, isInsideAnyActiveChallenge } from "@/lib/challenges";
import { addDays, startOfWeek, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getActiveChallenges,
  getDailyLogsSince,
  getProfile,
  habitRecords,
} from "@/lib/queries";
import { linkedinStreak, xStreak } from "@/lib/streaks";
import {
  SocialWeekGrid,
  type SocialDay,
} from "./_components/social-week-grid";

const DOWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SocialPage() {
  const profile = await getProfile();
  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);

  const [logs, challenges] = await Promise.all([
    getDailyLogsSince(addDays(today, -400)),
    getActiveChallenges(),
  ]);

  const windows = activeWindows(challenges);
  const xResult = xStreak(habitRecords(logs, "x"), today, windows);
  const liResult = linkedinStreak(habitRecords(logs, "linkedin"), today);
  const challengeActive = isInsideAnyActiveChallenge(today, challenges);

  const weekStart = startOfWeek(today, 1);
  const logByDate = new Map(logs.map((l) => [l.date, l]));
  const inWindow = (d: string) => windows.some((w) => d >= w.start && d <= w.end);

  const days: SocialDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const log = logByDate.get(date);
    return {
      date,
      dow: DOWS[i],
      isToday: date === today,
      isFuture: date > today,
      posted_x: log?.posted_x ?? false,
      posted_linkedin: log?.posted_linkedin ?? false,
      inChallenge: inWindow(date),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
        <p className="text-muted-foreground text-sm">
          Post daily during challenges, at least weekly otherwise.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StreakStat
          label="X / Twitter streak"
          result={xResult}
          hint={challengeActive ? "Daily — challenge active" : "At least weekly"}
        />
        <StreakStat
          label="LinkedIn streak"
          result={liResult}
          hint="At least weekly"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">This week</CardTitle>
            <Badge variant={challengeActive ? "default" : "secondary"}>
              {challengeActive ? "X cadence: daily" : "X cadence: weekly"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <SocialWeekGrid days={days} />
          <p className="text-muted-foreground mt-3 text-[11px]">
            Tap a cell to toggle a post. Ringed cells are inside an active
            challenge window (daily X target).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
