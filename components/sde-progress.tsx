import { AnimatedNumber } from "@/components/fx/animated-number";
import { Progress } from "@/components/ui/progress";
import { Numeral } from "@/components/ui/stat";
import type { ChecklistProgress, DifficultyBucket } from "@/lib/challenges";
import { difficultyChipClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const DIFF_ORDER: DifficultyBucket[] = ["Easy", "Medium", "Hard"];

/**
 * Hero progress readout for a checklist challenge (e.g. the SDE Sheet):
 * big done/total, a completion bar, and per-difficulty done counts. Pure /
 * server-renderable, so it's reused on the public share page.
 */
export function SdeProgress({
  progress,
  className,
}: {
  progress: ChecklistProgress;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 p-5", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium">Solved</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            <AnimatedNumber value={progress.done} />
            <span className="text-muted-foreground text-xl">
              {" "}
              / {progress.total}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-primary text-2xl font-semibold tabular-nums">
            <AnimatedNumber value={progress.percent} suffix="%" />
          </p>
          <p className="text-muted-foreground text-xs">complete</p>
        </div>
      </div>

      <Progress value={progress.percent} />

      <div className="grid grid-cols-3 gap-2">
        {DIFF_ORDER.map((d) => {
          const stat = progress.byDifficulty[d];
          return (
            <div
              key={d}
              className={cn(
                "rounded-lg px-3 py-2 text-center",
                difficultyChipClass(d),
              )}
            >
              <p className="text-sm font-semibold">
                <Numeral>{stat.done}</Numeral>
                <span className="opacity-60">/{stat.total}</span>
              </p>
              <p className="text-[11px] font-medium opacity-80">{d}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
