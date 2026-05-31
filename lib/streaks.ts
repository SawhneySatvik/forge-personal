import type { DayKey } from "@/lib/types";
import { addDays, dayInRange, prevDay, startOfWeek } from "@/lib/date";
import type { ChallengeWindow } from "@/lib/challenges";

/**
 * Pure streak engine. Fed `DayRecord[]` projected from the DB by query helpers;
 * never touches Supabase, so it is fully deterministic and unit-testable by
 * injecting `today`.
 *
 * Governing rule across all cadences: a streak is NEVER broken by the current
 * period (today / this week) not yet being satisfied — that period is "pending".
 * A streak only breaks at a period that has FULLY ELAPSED unsatisfied.
 */

export type Cadence =
  | { kind: "daily" }
  | { kind: "weekly"; weekStartsOn?: 0 | 1 }
  | { kind: "switching"; weekStartsOn?: 0 | 1 };

export interface DayRecord {
  day: DayKey;
  /** 'done' satisfies the habit; 'rest' is only meaningful for gym. */
  status: "done" | "rest";
}

export interface StreakOptions {
  cadence: Cadence;
  today: DayKey;
  /** Gym only: a 'rest' day bridges the streak (neither extends nor breaks). */
  restAware?: boolean;
  /** For the 'switching' cadence: inclusive windows that flip X to daily. */
  challengeWindows?: ChallengeWindow[];
}

export interface StreakResult {
  count: number;
  unit: "days" | "weeks";
  lastSatisfied: DayKey | null;
  /** Current period not yet satisfied but not yet elapsed ("log it to extend"). */
  pendingCurrent: boolean;
}

function indexByDay(records: DayRecord[]): Map<DayKey, DayRecord> {
  const byDay = new Map<DayKey, DayRecord>();
  for (const r of records) byDay.set(r.day, r);
  return byDay;
}

/** Latest 'done' day within [start, end] inclusive, or null. */
function latestDoneInRange(
  byDay: Map<DayKey, DayRecord>,
  start: DayKey,
  end: DayKey,
): DayKey | null {
  let latest: DayKey | null = null;
  for (const [day, rec] of byDay) {
    if (rec.status === "done" && day >= start && day <= end) {
      if (latest === null || day > latest) latest = day;
    }
  }
  return latest;
}

/** Latest day in [start, end] satisfying `predicate`, scanning at most a week. */
function latestDayMatching(
  start: DayKey,
  end: DayKey,
  predicate: (day: DayKey) => boolean,
): DayKey | null {
  for (let day = end; day >= start; day = prevDay(day)) {
    if (predicate(day)) return day;
  }
  return null;
}

function dailyStreak(
  byDay: Map<DayKey, DayRecord>,
  today: DayKey,
  restAware: boolean,
): StreakResult {
  let cursor = today;
  let count = 0;
  let lastSatisfied: DayKey | null = null;
  let pendingCurrent = false;

  while (true) {
    const rec = byDay.get(cursor);

    // Rest day (gym): neutral bridge — skip it, the streak survives.
    if (restAware && rec?.status === "rest") {
      cursor = prevDay(cursor);
      continue;
    }

    if (rec?.status === "done") {
      count += 1;
      if (lastSatisfied === null) lastSatisfied = cursor;
      cursor = prevDay(cursor);
      continue;
    }

    // Not satisfied.
    if (cursor === today) {
      // Today isn't done yet: pending, not broken. Evaluate yesterday.
      pendingCurrent = true;
      cursor = prevDay(cursor);
      continue;
    }

    break; // an elapsed past day with no activity ends the streak
  }

  return { count, unit: "days", lastSatisfied, pendingCurrent };
}

function weeklyStreak(
  byDay: Map<DayKey, DayRecord>,
  today: DayKey,
  weekStartsOn: 0 | 1,
): StreakResult {
  let weekStart = startOfWeek(today, weekStartsOn);
  let count = 0;
  let lastSatisfied: DayKey | null = null;
  let pendingCurrent = false;

  while (true) {
    const weekEnd = addDays(weekStart, 6);
    // Cap the current week's scan at today so a future-dated post can't satisfy
    // a week early (past weeks are unaffected since weekEnd <= today there).
    const scanEnd = weekEnd > today ? today : weekEnd;
    const hit = latestDoneInRange(byDay, weekStart, scanEnd);

    if (hit) {
      count += 1;
      if (lastSatisfied === null) lastSatisfied = hit;
      weekStart = addDays(weekStart, -7);
      continue;
    }

    if (dayInRange(today, weekStart, weekEnd)) {
      pendingCurrent = true; // this week has no post yet, but isn't over
      weekStart = addDays(weekStart, -7);
      continue;
    }

    break; // an elapsed past week with no post ends the streak
  }

  return { count, unit: "weeks", lastSatisfied, pendingCurrent };
}

/**
 * X / Twitter cadence: daily on any day inside an active challenge window,
 * weekly otherwise. We walk backwards; a day inside a window is a daily
 * obligation, a calendar week with no in-window days is a weekly obligation.
 * In a "mixed" week the in-window days are daily obligations and the remaining
 * (free) days carry no obligation — so they neither extend nor break the streak.
 */
function switchingStreak(
  byDay: Map<DayKey, DayRecord>,
  today: DayKey,
  windows: ChallengeWindow[],
  weekStartsOn: 0 | 1,
): StreakResult {
  const inChallenge = (day: DayKey) =>
    windows.some((w) => day >= w.start && day <= w.end);

  let cursor = today;
  let count = 0;
  let lastSatisfied: DayKey | null = null;
  let pendingCurrent = false;

  while (true) {
    if (inChallenge(cursor)) {
      // Daily obligation.
      const rec = byDay.get(cursor);
      if (rec?.status === "done") {
        count += 1;
        if (lastSatisfied === null) lastSatisfied = cursor;
        cursor = prevDay(cursor);
        continue;
      }
      if (cursor === today) {
        pendingCurrent = true;
        cursor = prevDay(cursor);
        continue;
      }
      break;
    }

    // Outside any window: weekly, but defer to in-window days in the same week.
    const weekStart = startOfWeek(cursor, weekStartsOn);
    const weekEnd = addDays(weekStart, 6);

    // (a) Challenge day(s) at or before cursor in this week -> descend into the
    // daily regime; the free days above them are neutral (no count, no break).
    const challengeAtOrBefore = latestDayMatching(weekStart, cursor, inChallenge);
    if (challengeAtOrBefore !== null) {
      cursor = challengeAtOrBefore;
      continue;
    }
    // (b) Mixed week whose challenge portion is LATER in the week than cursor:
    // those days were already counted by the daily branch on the way down, so we
    // must NOT re-scan them here (that was the double-count bug). The free prefix
    // is neutral -> skip the whole week.
    if (latestDayMatching(addDays(cursor, 1), weekEnd, inChallenge) !== null) {
      cursor = prevDay(weekStart);
      continue;
    }
    // (c) Pure non-challenge week: weekly obligation, capped at today.
    const scanEnd = weekEnd > today ? today : weekEnd;
    const hit = latestDoneInRange(byDay, weekStart, scanEnd);
    if (hit) {
      count += 1;
      if (lastSatisfied === null) lastSatisfied = hit;
      cursor = prevDay(weekStart);
      continue;
    }
    if (dayInRange(today, weekStart, weekEnd)) {
      pendingCurrent = true;
      cursor = prevDay(weekStart);
      continue;
    }
    break;
  }

  return {
    count,
    unit: inChallenge(today) ? "days" : "weeks",
    lastSatisfied,
    pendingCurrent,
  };
}

export function computeStreak(
  records: DayRecord[],
  opts: StreakOptions,
): StreakResult {
  const byDay = indexByDay(records);
  switch (opts.cadence.kind) {
    case "daily":
      return dailyStreak(byDay, opts.today, opts.restAware ?? false);
    case "weekly":
      return weeklyStreak(byDay, opts.today, opts.cadence.weekStartsOn ?? 1);
    case "switching":
      return switchingStreak(
        byDay,
        opts.today,
        opts.challengeWindows ?? [],
        opts.cadence.weekStartsOn ?? 1,
      );
  }
}

// --- Thin per-habit wrappers used by the dashboard --------------------------

export const dsaStreak = (records: DayRecord[], today: DayKey) =>
  computeStreak(records, { cadence: { kind: "daily" }, today });

export const systemDesignStreak = (records: DayRecord[], today: DayKey) =>
  computeStreak(records, { cadence: { kind: "daily" }, today });

export const gymStreak = (records: DayRecord[], today: DayKey) =>
  computeStreak(records, { cadence: { kind: "daily" }, today, restAware: true });

export const linkedinStreak = (records: DayRecord[], today: DayKey) =>
  computeStreak(records, { cadence: { kind: "weekly" }, today });

export const xStreak = (
  records: DayRecord[],
  today: DayKey,
  challengeWindows: ChallengeWindow[],
) =>
  computeStreak(records, {
    cadence: { kind: "switching" },
    today,
    challengeWindows,
  });
