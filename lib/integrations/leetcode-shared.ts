import { toDayKeyInTz } from "@/lib/date";
import type { DayKey } from "@/lib/types";

/**
 * Pure mapping from LeetCode's `submissionCalendar` (a record of UTC-midnight
 * unix-seconds → submission count) to per-day counts keyed by DayKey in the
 * user's timezone. Kept free of `server-only`/network so it can be unit-tested.
 *
 * Converting the instant (not adding a fixed offset) is what makes the IST
 * boundary correct: a submission at 23:30 UTC belongs to the next day in IST.
 * Multiple UTC days can collapse into one local day → counts accumulate.
 */
export function submissionCalendarToCountByDay(
  raw: Record<string, number>,
  timezone: string,
): Record<DayKey, number> {
  const out: Record<DayKey, number> = {};
  for (const [unix, count] of Object.entries(raw)) {
    const n = Number(count);
    if (!n) continue;
    const seconds = Number(unix);
    if (!Number.isFinite(seconds)) continue;
    const day = toDayKeyInTz(new Date(seconds * 1000), timezone);
    out[day] = (out[day] ?? 0) + n;
  }
  return out;
}
