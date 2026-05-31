import type { Challenge, ChallengePhase, DayKey } from "@/lib/types";
import { addDays, dayInRange, daysBetween } from "@/lib/date";

/**
 * Pure, data-driven challenge engine. A challenge is `start_date` + an ordered
 * list of phases, each with a `duration_days` and a `topics[]` list. Nothing is
 * hardcoded — the 45-day SDE sheet is just one such row.
 */

export interface ChallengeWindow {
  start: DayKey;
  end: DayKey; // inclusive
}

export interface PhasePosition {
  phase: ChallengePhase;
  phaseIndex: number; // 0-based
  dayWithinPhase: number; // 1-based
  topicForToday: string | null;
  isLastDayOfPhase: boolean;
}

export interface ChallengeProgress {
  totalDays: number;
  daysElapsed: number; // clamped to [0, totalDays]
  percentElapsed: number; // 0..100
  topicsTotal: number;
  topicsCovered: number; // distinct in-window days the habit was satisfied
  isActiveToday: boolean;
  window: ChallengeWindow | null;
}

function sortedPhases(challenge: Challenge): ChallengePhase[] {
  return [...(challenge.phases ?? [])].sort((a, b) => a.sort_order - b.sort_order);
}

export function totalDays(challenge: Challenge): number {
  return sortedPhases(challenge).reduce((sum, p) => sum + p.duration_days, 0);
}

/** Inclusive [start, end] window, or null if start date / phases are unset. */
export function challengeWindow(challenge: Challenge): ChallengeWindow | null {
  const days = totalDays(challenge);
  if (!challenge.start_date || days <= 0) return null;
  return {
    start: challenge.start_date,
    end: addDays(challenge.start_date, days - 1),
  };
}

/**
 * Resolve the phase + topic governing `today`. Returns null if the challenge
 * hasn't started yet or has already finished.
 */
export function getCurrentPhase(
  challenge: Challenge,
  today: DayKey,
): PhasePosition | null {
  if (!challenge.start_date) return null;
  const offset = daysBetween(challenge.start_date, today); // 0-based
  if (offset < 0) return null;

  const phases = sortedPhases(challenge);
  let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    if (offset < acc + p.duration_days) {
      const dayWithinPhase = offset - acc + 1; // 1-based
      return {
        phase: p,
        phaseIndex: i,
        dayWithinPhase,
        topicForToday: p.topics[dayWithinPhase - 1] ?? null,
        isLastDayOfPhase: dayWithinPhase === p.duration_days,
      };
    }
    acc += p.duration_days;
  }
  return null; // offset is beyond the final phase
}

export function getChallengeProgress(
  challenge: Challenge,
  today: DayKey,
  satisfiedDays: DayKey[] = [],
): ChallengeProgress {
  const days = totalDays(challenge);
  const window = challengeWindow(challenge);
  const phases = sortedPhases(challenge);
  const topicsTotal = phases.reduce((sum, p) => sum + p.topics.length, 0);

  let daysElapsed = 0;
  if (challenge.start_date) {
    const raw = daysBetween(challenge.start_date, today) + 1; // inclusive of today
    daysElapsed = Math.max(0, Math.min(raw, days));
  }

  // Cap the covered range at today so future-dated logs don't overstate progress
  // (keeps topicsCovered consistent with daysElapsed).
  const coverEnd =
    window && window.end > today ? today : (window?.end ?? today);
  const topicsCovered = window
    ? new Set(
        satisfiedDays.filter((d) => dayInRange(d, window.start, coverEnd)),
      ).size
    : 0;

  return {
    totalDays: days,
    daysElapsed,
    percentElapsed: days === 0 ? 0 : Math.round((daysElapsed / days) * 100),
    topicsTotal,
    topicsCovered,
    isActiveToday:
      challenge.status === "Active" &&
      window !== null &&
      dayInRange(today, window.start, window.end),
    window,
  };
}

/** Inclusive windows of all Active challenges (those with a resolvable window). */
export function activeWindows(challenges: Challenge[]): ChallengeWindow[] {
  return challenges
    .filter((c) => c.status === "Active")
    .map(challengeWindow)
    .filter((w): w is ChallengeWindow => w !== null);
}

/**
 * Does `today` fall inside any Active challenge window? This is the single
 * integration point with the streak engine: it drives X's daily-vs-weekly
 * cadence ("post daily during challenges, at least weekly otherwise").
 */
export function isInsideAnyActiveChallenge(
  today: DayKey,
  challenges: Challenge[],
): boolean {
  return activeWindows(challenges).some((w) =>
    dayInRange(today, w.start, w.end),
  );
}
