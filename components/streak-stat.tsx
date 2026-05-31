import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Numeral } from "@/components/ui/stat";
import type { StreakResult } from "@/lib/streaks";
import { cn } from "@/lib/utils";

/** A single prominent streak readout — used as a page header on habit pages. */
export function StreakStat({
  label,
  result,
  hint,
}: {
  label: string;
  result: StreakResult;
  hint?: string;
}) {
  const live = result.count > 0;
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <Numeral className="text-3xl font-semibold">{result.count}</Numeral>
            <span className="text-muted-foreground text-xs">
              {result.unit === "weeks" ? "wk streak" : "day streak"}
            </span>
          </div>
          {result.pendingCurrent ? (
            <p className="text-primary mt-1 text-[11px]">
              Log {result.unit === "weeks" ? "this week" : "today"} to extend
            </p>
          ) : hint ? (
            <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p>
          ) : null}
        </div>
        <Flame
          className={cn(
            "size-7 shrink-0",
            live ? "text-primary ember-flicker" : "text-muted-foreground/30",
          )}
        />
      </CardContent>
    </Card>
  );
}
