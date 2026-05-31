import { describe, expect, it } from "vitest";
import { addDays, startOfWeek } from "@/lib/date";
import {
  type DayRecord,
  dsaStreak,
  gymStreak,
  linkedinStreak,
  xStreak,
} from "@/lib/streaks";
import type { ChallengeWindow } from "@/lib/challenges";

const TODAY = "2026-05-20"; // a Wednesday
const done = (day: string): DayRecord => ({ day, status: "done" });
const rest = (day: string): DayRecord => ({ day, status: "rest" });

describe("daily streak (DSA / system design)", () => {
  it("counts consecutive done days including today", () => {
    const r = [done(TODAY), done(addDays(TODAY, -1)), done(addDays(TODAY, -2))];
    const s = dsaStreak(r, TODAY);
    expect(s.count).toBe(3);
    expect(s.pendingCurrent).toBe(false);
    expect(s.lastSatisfied).toBe(TODAY);
  });

  it("today-not-yet-done is pending, never broken", () => {
    const r = [done(addDays(TODAY, -1)), done(addDays(TODAY, -2))];
    const s = dsaStreak(r, TODAY);
    expect(s.count).toBe(2);
    expect(s.pendingCurrent).toBe(true);
    expect(s.lastSatisfied).toBe(addDays(TODAY, -1));
  });

  it("a missing past day breaks the streak", () => {
    const r = [done(addDays(TODAY, -2))]; // yesterday skipped
    const s = dsaStreak(r, TODAY);
    expect(s.count).toBe(0);
    expect(s.pendingCurrent).toBe(true);
  });

  it("empty history -> 0, pending today", () => {
    const s = dsaStreak([], TODAY);
    expect(s.count).toBe(0);
    expect(s.pendingCurrent).toBe(true);
  });
});

describe("gym streak (rest-aware)", () => {
  it("rest day bridges: went -> rest -> went is an unbroken streak of 2", () => {
    const r = [done(TODAY), rest(addDays(TODAY, -1)), done(addDays(TODAY, -2))];
    const s = gymStreak(r, TODAY);
    expect(s.count).toBe(2);
    expect(s.pendingCurrent).toBe(false);
  });

  it("rest today preserves a prior streak without marking pending", () => {
    const r = [rest(TODAY), done(addDays(TODAY, -1))];
    const s = gymStreak(r, TODAY);
    expect(s.count).toBe(1);
    expect(s.pendingCurrent).toBe(false);
    expect(s.lastSatisfied).toBe(addDays(TODAY, -1));
  });

  it("an unmarked skip in the past breaks the streak", () => {
    const r = [done(TODAY), done(addDays(TODAY, -2))]; // -1 skipped
    const s = gymStreak(r, TODAY);
    expect(s.count).toBe(1);
  });

  it("only rest days -> 0 but not broken", () => {
    const r = [rest(TODAY), rest(addDays(TODAY, -1))];
    const s = gymStreak(r, TODAY);
    expect(s.count).toBe(0);
    expect(s.lastSatisfied).toBeNull();
  });
});

describe("weekly streak (LinkedIn, Monday weeks)", () => {
  const ws = startOfWeek(TODAY, 1); // Monday of TODAY's week

  it("posting this week counts the current week", () => {
    const s = linkedinStreak([done(TODAY)], TODAY);
    expect(s.count).toBe(1);
    expect(s.unit).toBe("weeks");
    expect(s.pendingCurrent).toBe(false);
  });

  it("not posted this week but last week -> count 1, pending current week", () => {
    const s = linkedinStreak([done(addDays(ws, -1))], TODAY); // last week's Sunday
    expect(s.count).toBe(1);
    expect(s.pendingCurrent).toBe(true);
  });

  it("three consecutive weeks including this one", () => {
    const r = [done(TODAY), done(addDays(ws, -1)), done(addDays(ws, -8))];
    const s = linkedinStreak(r, TODAY);
    expect(s.count).toBe(3);
  });

  it("a fully-missed past week breaks the streak", () => {
    const r = [done(TODAY), done(addDays(ws, -8))]; // last week missed
    const s = linkedinStreak(r, TODAY);
    expect(s.count).toBe(1);
  });

  it("a future-dated post this week does NOT satisfy it early", () => {
    // TODAY is a Wednesday; a post dated this Friday is still in the future.
    const future = addDays(TODAY, 2);
    const s = linkedinStreak([done(future)], TODAY);
    expect(s.count).toBe(0);
    expect(s.pendingCurrent).toBe(true);
  });
});

describe("switching streak (X: daily in challenge, weekly otherwise)", () => {
  it("with no active challenge, behaves weekly", () => {
    const s = xStreak([done(TODAY)], TODAY, []);
    expect(s.count).toBe(1);
    expect(s.unit).toBe("weeks");
  });

  it("inside a challenge window it requires daily posts", () => {
    const win: ChallengeWindow = { start: addDays(TODAY, -5), end: addDays(TODAY, 5) };
    const r = [done(TODAY), done(addDays(TODAY, -1))];
    const s = xStreak(r, TODAY, [win]);
    expect(s.count).toBe(2);
    expect(s.unit).toBe("days");
    expect(s.pendingCurrent).toBe(false);
  });

  it("inside a challenge, missing today is pending not broken", () => {
    const win: ChallengeWindow = { start: addDays(TODAY, -5), end: addDays(TODAY, 5) };
    const r = [done(addDays(TODAY, -1))];
    const s = xStreak(r, TODAY, [win]);
    expect(s.count).toBe(1);
    expect(s.pendingCurrent).toBe(true);
    expect(s.unit).toBe("days");
  });

  it("transition: weekly now + daily challenge week prior accumulate", () => {
    // today is a Sunday so the whole "this week" is well-defined.
    const sunday = addDays(startOfWeek(TODAY, 1), 6);
    const ws = startOfWeek(sunday, 1);
    const lastWeekStart = addDays(ws, -7);
    // Last week (Mon..Sun) is entirely a challenge: daily posts required & made.
    const win: ChallengeWindow = { start: lastWeekStart, end: addDays(lastWeekStart, 6) };
    const records: DayRecord[] = [done(sunday)]; // posted today (this week, weekly)
    for (let i = 0; i < 7; i++) records.push(done(addDays(lastWeekStart, i)));
    const s = xStreak(records, sunday, [win]);
    // 1 (current weekly week) + 7 (daily challenge days) = 8
    expect(s.count).toBe(8);
    expect(s.unit).toBe("weeks"); // today is outside the challenge
  });

  it("free tail of a mixed week is neutral (no break)", () => {
    const sunday = addDays(startOfWeek(TODAY, 1), 6);
    const ws = startOfWeek(sunday, 1); // Monday of this week
    // Challenge covers Mon..Wed of this week; Thu..Sun are free.
    const win: ChallengeWindow = { start: ws, end: addDays(ws, 2) };
    // Posted the 3 challenge days; did NOT post the free Thu..Sun (incl today).
    const records = [done(ws), done(addDays(ws, 1)), done(addDays(ws, 2))];
    const s = xStreak(records, sunday, [win]);
    expect(s.count).toBe(3); // free unposted days don't break it
    expect(s.pendingCurrent).toBe(false);
  });

  it("a challenge starting MID-week does not double-count posts (regression)", () => {
    // Window Wed..Fri of TODAY's week; today = that Wednesday; one post (Wed).
    const ws = startOfWeek(TODAY, 1);
    const wed = addDays(ws, 2);
    const win: ChallengeWindow = { start: wed, end: addDays(ws, 4) };
    const s = xStreak([done(wed)], wed, [win]);
    expect(s.count).toBe(1); // not 2 — the Wed post must not be re-counted weekly
    expect(s.unit).toBe("days");
  });
});
