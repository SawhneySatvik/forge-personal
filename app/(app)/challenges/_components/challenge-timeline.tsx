import { getCurrentPhase } from "@/lib/challenges";
import { addDays } from "@/lib/date";
import type { Challenge } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChallengeTimeline({
  challenge,
  today,
}: {
  challenge: Challenge;
  today: string;
}) {
  const phases = challenge.phases ?? [];
  const current = getCurrentPhase(challenge, today);

  return (
    <ol className="space-y-3">
      {phases.map((p, i) => {
        const startOffset = phases
          .slice(0, i)
          .reduce((sum, q) => sum + q.duration_days, 0);
        const start = challenge.start_date
          ? addDays(challenge.start_date, startOffset)
          : null;
        const end = challenge.start_date
          ? addDays(challenge.start_date, startOffset + p.duration_days - 1)
          : null;
        const isCurrent = current?.phaseIndex === i;

        return (
          <li
            key={p.id}
            className={cn(
              "rounded-lg border p-4",
              isCurrent && "border-primary ring-primary/30 ring-1",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                Phase {i + 1}: {p.name}
                {isCurrent ? (
                  <span className="text-primary ml-2 text-xs">· current</span>
                ) : null}
              </span>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {p.duration_days}d{start && end ? ` · ${start} → ${end}` : ""}
              </span>
            </div>
            {p.topics.length ? (
              <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {p.topics.map((t, ti) => (
                  <li
                    key={ti}
                    className={cn(
                      "text-muted-foreground rounded-md border px-2 py-0.5",
                      isCurrent &&
                        current?.topicForToday === t &&
                        "border-primary text-primary font-medium",
                    )}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
