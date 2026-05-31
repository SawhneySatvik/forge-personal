import { addDays, dayInRange, startOfWeek } from "@/lib/date";
import {
  computeLongestStreak,
  dsaStreak,
  gymStreak,
  linkedinStreak,
  systemDesignStreak,
  xStreak,
  type DayRecord,
} from "@/lib/streaks";
import type {
  DailyLog,
  DayKey,
  DsaProblem,
  HabitKey,
  SystemDesignTopic,
} from "@/lib/types";

/**
 * Pure productivity analytics. No DB access (so it's unit-testable and never
 * imports the server-only query layer). Pages fetch rows and pass them in.
 */

/** Number of the 5 habits completed each day (0..5) — feeds the aggregate heatmap. */
export function habitsCompletedByDay(logs: DailyLog[]): Record<DayKey, number> {
  const out: Record<DayKey, number> = {};
  for (const l of logs) {
    out[l.date] =
      (l.dsa_done ? 1 : 0) +
      (l.system_design_done ? 1 : 0) +
      (l.gym_status != null ? 1 : 0) +
      (l.posted_x ? 1 : 0) +
      (l.posted_linkedin ? 1 : 0);
  }
  return out;
}

/**
 * Overall 30-day consistency, 0..100. Averages each habit's completion rate so
 * weekly habits aren't unfairly penalised: daily habits = days-done/30, weekly
 * habits = weeks-with-a-post / weeks-in-window.
 */
export function consistencyScore30d(logs: DailyLog[], today: DayKey): number {
  const start = addDays(today, -29);
  const w = logs.filter((l) => dayInRange(l.date, start, today));
  const dailyRate = (pred: (l: DailyLog) => boolean) =>
    w.filter(pred).length / 30;

  const weekStarts = new Set<DayKey>();
  for (let d = start; d <= today; d = addDays(d, 1)) {
    weekStarts.add(startOfWeek(d, 1));
  }
  const weeksTotal = weekStarts.size || 1;
  const weeklyRate = (pred: (l: DailyLog) => boolean) => {
    const hit = new Set<DayKey>();
    for (const l of w) if (pred(l)) hit.add(startOfWeek(l.date, 1));
    return hit.size / weeksTotal;
  };

  const dsa = dailyRate((l) => l.dsa_done);
  const sd = dailyRate((l) => l.system_design_done);
  const gym = dailyRate((l) => l.gym_status != null);
  const x = weeklyRate((l) => l.posted_x);
  const li = weeklyRate((l) => l.posted_linkedin);
  return Math.round(((dsa + sd + gym + x + li) / 5) * 100);
}

export interface WeekActivity {
  week: DayKey;
  label: string;
  dsa: number;
  system_design: number;
  gym: number;
  x: number;
  linkedin: number;
}

function monthDay(day: DayKey): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

/** Per-week completion counts for the last `weeks` calendar weeks (stacked bar). */
export function weeklyActivity(
  logs: DailyLog[],
  today: DayKey,
  weeks = 8,
): WeekActivity[] {
  const thisWeek = startOfWeek(today, 1);
  const out: WeekActivity[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = addDays(thisWeek, -7 * i);
    const we = addDays(ws, 6);
    const wl = logs.filter((l) => dayInRange(l.date, ws, we));
    out.push({
      week: ws,
      label: monthDay(ws),
      dsa: wl.filter((l) => l.dsa_done).length,
      system_design: wl.filter((l) => l.system_design_done).length,
      gym: wl.filter((l) => l.gym_status != null).length,
      x: wl.filter((l) => l.posted_x).length,
      linkedin: wl.filter((l) => l.posted_linkedin).length,
    });
  }
  return out;
}

export function dsaByDifficulty(
  problems: DsaProblem[],
): { difficulty: "Easy" | "Medium" | "Hard"; count: number }[] {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  for (const p of problems) {
    if (p.difficulty && p.difficulty in counts) counts[p.difficulty] += 1;
  }
  return (["Easy", "Medium", "Hard"] as const).map((d) => ({
    difficulty: d,
    count: counts[d],
  }));
}

export function dsaByTopic(
  problems: DsaProblem[],
  topN = 10,
): { topic: string; count: number }[] {
  const m = new Map<string, number>();
  for (const p of problems) {
    const t = p.topic?.trim();
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function dsaCumulative(
  problems: DsaProblem[],
): { date: DayKey; total: number }[] {
  const perDay = new Map<DayKey, number>();
  for (const p of problems) perDay.set(p.date, (perDay.get(p.date) ?? 0) + 1);
  const days = [...perDay.keys()].sort();
  let total = 0;
  return days.map((date) => {
    total += perDay.get(date)!;
    return { date, total };
  });
}

export function systemDesignCoverageOverTime(
  topics: SystemDesignTopic[],
): { date: DayKey; total: number }[] {
  const perDay = new Map<DayKey, number>();
  for (const t of topics) {
    if (t.covered && t.covered_at) {
      const day = t.covered_at.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
  }
  const days = [...perDay.keys()].sort();
  let total = 0;
  return days.map((date) => {
    total += perDay.get(date)!;
    return { date, total };
  });
}

function projectHabit(logs: DailyLog[], habit: HabitKey): DayRecord[] {
  const records: DayRecord[] = [];
  for (const l of logs) {
    switch (habit) {
      case "dsa":
        if (l.dsa_done) records.push({ day: l.date, status: "done" });
        break;
      case "system_design":
        if (l.system_design_done) records.push({ day: l.date, status: "done" });
        break;
      case "gym":
        if (l.gym_status)
          records.push({
            day: l.date,
            status: l.gym_status === "went" ? "done" : "rest",
          });
        break;
      case "x":
        if (l.posted_x) records.push({ day: l.date, status: "done" });
        break;
      case "linkedin":
        if (l.posted_linkedin) records.push({ day: l.date, status: "done" });
        break;
    }
  }
  return records;
}

export interface HabitStat {
  key: HabitKey;
  label: string;
  current: number;
  longest: number;
  unit: "days" | "weeks";
}

const HABIT_DEFS: { key: HabitKey; label: string }[] = [
  { key: "dsa", label: "DSA" },
  { key: "system_design", label: "System Design" },
  { key: "gym", label: "Gym" },
  { key: "x", label: "X / Twitter" },
  { key: "linkedin", label: "LinkedIn" },
];

/** Current + longest streak per habit. `windows` drives X's switching cadence. */
export function perHabitStats(
  logs: DailyLog[],
  today: DayKey,
  windows: { start: DayKey; end: DayKey }[] = [],
): HabitStat[] {
  return HABIT_DEFS.map(({ key, label }) => {
    const records = projectHabit(logs, key);
    if (key === "x") {
      return {
        key,
        label,
        current: xStreak(records, today, windows).count,
        longest: computeLongestStreak(records, { kind: "switching" }),
        unit: "weeks",
      };
    }
    if (key === "linkedin") {
      return {
        key,
        label,
        current: linkedinStreak(records, today).count,
        longest: computeLongestStreak(records, { kind: "weekly" }),
        unit: "weeks",
      };
    }
    if (key === "gym") {
      return {
        key,
        label,
        current: gymStreak(records, today).count,
        longest: computeLongestStreak(records, { kind: "daily" }, { restAware: true }),
        unit: "days",
      };
    }
    const current =
      key === "dsa"
        ? dsaStreak(records, today).count
        : systemDesignStreak(records, today).count;
    return {
      key,
      label,
      current,
      longest: computeLongestStreak(records, { kind: "daily" }),
      unit: "days",
    };
  });
}
