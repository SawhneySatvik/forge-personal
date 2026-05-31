import type { DayKey } from "@/lib/types";

/**
 * Day-key utilities. Every value is a 'YYYY-MM-DD' string. Because the format is
 * fixed-width and zero-padded, lexical comparison equals chronological order, so
 * range checks are plain string comparisons. All arithmetic goes through UTC
 * midnight to sidestep DST/offset drift — the ONLY place a real timezone matters
 * is resolving "today", which `todayInTz` handles via Intl.
 */

const DAY_MS = 86_400_000;

/** Today's calendar date in the given IANA timezone (e.g. 'Asia/Kolkata'). */
export function todayInTz(timezone: string, now: Date = new Date()): DayKey {
  return toDayKeyInTz(now, timezone);
}

/** The calendar day a specific instant falls on, in the given timezone. */
export function toDayKeyInTz(date: Date, timezone: string): DayKey {
  // en-CA renders dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toUtcMs(day: DayKey): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): DayKey {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(day: DayKey, n: number): DayKey {
  return fromUtcMs(toUtcMs(day) + n * DAY_MS);
}

export function prevDay(day: DayKey): DayKey {
  return addDays(day, -1);
}

/** Whole days from `a` to `b` (i.e. b − a). Negative when `b` precedes `a`. */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(day: DayKey): number {
  return new Date(toUtcMs(day)).getUTCDay();
}

/** Start of the calendar week containing `day` (default Monday). */
export function startOfWeek(day: DayKey, weekStartsOn: 0 | 1 = 1): DayKey {
  const diff = (dayOfWeek(day) - weekStartsOn + 7) % 7;
  return addDays(day, -diff);
}

/** Inclusive range check. Valid because day keys sort lexically. */
export function dayInRange(day: DayKey, start: DayKey, end: DayKey): boolean {
  return day >= start && day <= end;
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True if `value` is a well-formed 'YYYY-MM-DD' day key. */
export function isDayKey(value: string): value is DayKey {
  if (!DAY_KEY_RE.test(value)) return false;
  // Reject impossible dates like 2026-13-40 by round-tripping.
  return fromUtcMs(toUtcMs(value)) === value;
}
