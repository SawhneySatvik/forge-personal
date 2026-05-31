import { addDays, startOfWeek } from "@/lib/date";
import type { DayKey, GymStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type BaseProps = {
  endDay: DayKey;
  weeks?: number;
  weekStartsOn?: 0 | 1;
  className?: string;
};

export type HabitHeatmapProps = BaseProps &
  (
    | {
        mode: "count";
        valueByDay: Record<DayKey, number>;
        max?: number;
        legend?: boolean;
      }
    | { mode: "gym"; statusByDay: Record<DayKey, GymStatus> }
  );

function countCell(value: number | undefined, max: number, future: boolean) {
  if (future) return "bg-transparent";
  if (!value) return "bg-muted";
  const ratio = max <= 1 ? 1 : value / max;
  if (ratio > 0.75) return "bg-primary";
  if (ratio > 0.5) return "bg-primary/75";
  if (ratio > 0.25) return "bg-primary/55";
  return "bg-primary/35";
}

function gymCell(status: GymStatus | undefined, future: boolean) {
  if (future) return "bg-transparent";
  if (status === "went") return "bg-emerald-500";
  if (status === "rest") return "bg-sky-400/60";
  return "bg-muted";
}

/**
 * GitHub-style contribution grid. Pure / server-renderable. Two modes:
 * `count` (ember intensity buckets from a per-day number) and `gym`
 * (3-state went/rest/none). Generalizes the old gym heatmap.
 */
export function HabitHeatmap(props: HabitHeatmapProps) {
  const { endDay, weeks = 52, weekStartsOn = 1 } = props;
  const gridStart = addDays(startOfWeek(endDay, weekStartsOn), -7 * (weeks - 1));
  const days: DayKey[] = [];
  for (let i = 0; i < weeks * 7; i++) days.push(addDays(gridStart, i));

  const max =
    props.mode === "count"
      ? (props.max ?? Math.max(1, ...Object.values(props.valueByDay)))
      : 1;

  return (
    <div className={cn("space-y-3", props.className)}>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid grid-flow-col grid-rows-7 gap-1"
          style={{ width: "max-content" }}
        >
          {days.map((day) => {
            const future = day > endDay;
            let klass: string;
            let title: string;
            if (props.mode === "gym") {
              const s = props.statusByDay[day];
              klass = gymCell(s, future);
              title = `${day}${s ? ` · ${s}` : ""}`;
            } else {
              const v = props.valueByDay[day];
              klass = countCell(v, max, future);
              title = `${day}${v ? ` · ${v}` : ""}`;
            }
            return (
              <div
                key={day}
                title={title}
                className={cn("size-3 rounded-[3px]", klass)}
              />
            );
          })}
        </div>
      </div>

      {props.mode === "gym" ? (
        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
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
      ) : props.legend !== false ? (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span>Less</span>
          <span className="bg-muted size-3 rounded-[3px]" />
          <span className="bg-primary/35 size-3 rounded-[3px]" />
          <span className="bg-primary/55 size-3 rounded-[3px]" />
          <span className="bg-primary/75 size-3 rounded-[3px]" />
          <span className="bg-primary size-3 rounded-[3px]" />
          <span>More</span>
        </div>
      ) : null}
    </div>
  );
}
