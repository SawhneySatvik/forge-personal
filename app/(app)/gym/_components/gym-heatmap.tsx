import { addDays, startOfWeek } from "@/lib/date";
import type { DayKey, GymStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function cellClass(status: GymStatus | undefined, future: boolean): string {
  if (future) return "bg-transparent";
  if (status === "went") return "bg-emerald-500";
  if (status === "rest") return "bg-sky-400/60";
  return "bg-muted";
}

/** GitHub-style grid of went/rest/skip days. Pure render; native title tooltips. */
export function GymHeatmap({
  statusByDay,
  endDay,
  weeks = 52,
  weekStartsOn = 1,
}: {
  statusByDay: Record<DayKey, GymStatus>;
  endDay: DayKey;
  weeks?: number;
  weekStartsOn?: 0 | 1;
}) {
  const gridStart = addDays(startOfWeek(endDay, weekStartsOn), -7 * (weeks - 1));
  const days: DayKey[] = [];
  for (let i = 0; i < weeks * 7; i++) days.push(addDays(gridStart, i));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div
          className="grid grid-flow-col grid-rows-7 gap-1"
          style={{ width: "max-content" }}
        >
          {days.map((day) => {
            const status = statusByDay[day];
            const future = day > endDay;
            return (
              <div
                key={day}
                title={`${day}${status ? ` · ${status}` : ""}`}
                className={cn("size-3 rounded-[3px]", cellClass(status, future))}
              />
            );
          })}
        </div>
      </div>
      <div className="text-muted-foreground flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-emerald-500" /> Went
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-sky-400/60" /> Rest
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-muted size-3 rounded-[3px]" /> No entry
        </span>
      </div>
    </div>
  );
}
