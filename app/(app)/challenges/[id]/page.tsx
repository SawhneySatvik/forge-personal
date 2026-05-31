import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Numeral } from "@/components/ui/stat";
import { getChallengeProgress, getCurrentPhase } from "@/lib/challenges";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getChallenge,
  getDailyLogsSince,
  getProfile,
  habitRecords,
} from "@/lib/queries";
import { ChallengeControls } from "../_components/challenge-controls";
import { ChallengeTimeline } from "../_components/challenge-timeline";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, challenge] = await Promise.all([getProfile(), getChallenge(id)]);
  if (!challenge) notFound();

  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);
  const logs = await getDailyLogsSince(addDays(today, -400));
  const dsaDays = habitRecords(logs, "dsa").map((r) => r.day);
  const progress = getChallengeProgress(challenge, today, dsaDays);
  const phase = getCurrentPhase(challenge, today);

  return (
    <div className="space-y-6">
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
        <ChallengeControls id={challenge.id} status={challenge.status} />
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
            <Numeral>{progress.topicsCovered}</Numeral> active days logged
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium">Phases</h2>
        <ChallengeTimeline challenge={challenge} today={today} />
      </div>
    </div>
  );
}
