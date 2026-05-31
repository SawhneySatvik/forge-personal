import Link from "next/link";
import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getChallengeProgress,
  getCurrentPhase,
  isChecklist,
  type ChecklistProgress,
} from "@/lib/challenges";
import type { Challenge, ChallengeStatus } from "@/lib/types";

function statusVariant(
  status: ChallengeStatus,
): "default" | "secondary" | "outline" {
  if (status === "Active") return "default";
  if (status === "Completed") return "secondary";
  return "outline";
}

export function ChallengeCard({
  challenge,
  today,
  satisfiedDays,
  checklist,
}: {
  challenge: Challenge;
  today: string;
  satisfiedDays: string[];
  checklist?: ChecklistProgress;
}) {
  const checklistKind = isChecklist(challenge);
  const progress = checklistKind
    ? null
    : getChallengeProgress(challenge, today, satisfiedDays);
  const phase = checklistKind ? null : getCurrentPhase(challenge, today);

  return (
    <Link href={`/challenges/${challenge.id}`} className="block">
      <Card className="h-full transition-shadow hover:ring-foreground/20">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{challenge.name}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              {challenge.is_public ? (
                <Globe className="text-muted-foreground size-3.5" />
              ) : null}
              <Badge variant={statusVariant(challenge.status)}>
                {challenge.status}
              </Badge>
            </div>
          </div>

          {checklistKind && checklist ? (
            <div className="space-y-1.5 pt-1">
              <Progress value={checklist.percent} />
              <p className="text-muted-foreground text-xs">
                {checklist.done}/{checklist.total} solved · {checklist.percent}%
              </p>
            </div>
          ) : null}

          {!checklistKind && challenge.start_date ? (
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {challenge.start_date}
              {challenge.end_date ? ` → ${challenge.end_date}` : ""}
            </p>
          ) : null}
          {!checklistKind && progress ? (
            challenge.status === "Active" ? (
              <div className="space-y-1.5 pt-1">
                <Progress value={progress.percentElapsed} />
                {phase ? (
                  <p className="text-xs">
                    Phase {phase.phaseIndex + 1}: {phase.phase.name}
                    <span className="text-muted-foreground">
                      {" "}
                      · Day {phase.dayWithinPhase}/{phase.phase.duration_days}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Day {progress.daysElapsed}/{progress.totalDays}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                {progress.totalDays} days · {challenge.phases?.length ?? 0} phases
              </p>
            )
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
