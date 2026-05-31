import { describe, expect, it } from "vitest";
import {
  challengeWindow,
  getChallengeProgress,
  getChallengeTracking,
  getCurrentPhase,
  isInsideAnyActiveChallenge,
} from "@/lib/challenges";
import type { Challenge, ChallengePhase } from "@/lib/types";

function phase(
  name: string,
  duration_days: number,
  sort_order: number,
  topics: string[],
): ChallengePhase {
  return {
    id: `p${sort_order}`,
    user_id: "u",
    challenge_id: "c",
    name,
    duration_days,
    sort_order,
    topics,
    created_at: "",
  };
}

function makeChallenge(): Challenge {
  return {
    id: "c",
    user_id: "u",
    name: "Test",
    description: null,
    start_date: "2026-01-01",
    end_date: null,
    status: "Active",
    created_at: "",
    updated_at: "",
    phases: [
      phase("Arrays", 7, 1, ["a1", "a2"]),
      phase("Binary Search", 4, 2, ["b1"]),
    ],
  };
}

describe("getCurrentPhase", () => {
  it("resolves the first phase + topic on day 1", () => {
    const pos = getCurrentPhase(makeChallenge(), "2026-01-01");
    expect(pos?.phase.name).toBe("Arrays");
    expect(pos?.dayWithinPhase).toBe(1);
    expect(pos?.topicForToday).toBe("a1");
    expect(pos?.isLastDayOfPhase).toBe(false);
  });

  it("returns null topic past the topic list and flags last day", () => {
    const pos = getCurrentPhase(makeChallenge(), "2026-01-07"); // day 7 of Arrays
    expect(pos?.phase.name).toBe("Arrays");
    expect(pos?.dayWithinPhase).toBe(7);
    expect(pos?.topicForToday).toBeNull();
    expect(pos?.isLastDayOfPhase).toBe(true);
  });

  it("crosses into the next phase", () => {
    const pos = getCurrentPhase(makeChallenge(), "2026-01-08"); // day 8 -> Binary Search day 1
    expect(pos?.phase.name).toBe("Binary Search");
    expect(pos?.dayWithinPhase).toBe(1);
    expect(pos?.topicForToday).toBe("b1");
  });

  it("is null before start and after the final phase", () => {
    expect(getCurrentPhase(makeChallenge(), "2025-12-31")).toBeNull();
    expect(getCurrentPhase(makeChallenge(), "2026-01-12")).toBeNull(); // 11 days total
  });
});

describe("challengeWindow + progress", () => {
  it("computes the inclusive window (11 days)", () => {
    expect(challengeWindow(makeChallenge())).toEqual({
      start: "2026-01-01",
      end: "2026-01-11",
    });
  });

  it("computes elapsed days, percent and covered topics", () => {
    const p = getChallengeProgress(makeChallenge(), "2026-01-05", [
      "2026-01-02",
      "2026-01-03",
      "2025-12-30", // outside the window, ignored
    ]);
    expect(p.totalDays).toBe(11);
    expect(p.daysElapsed).toBe(5); // Jan 1..5 inclusive
    expect(p.percentElapsed).toBe(Math.round((5 / 11) * 100));
    expect(p.topicsTotal).toBe(3);
    expect(p.topicsCovered).toBe(2);
    expect(p.isActiveToday).toBe(true);
  });

  it("does not count future-dated satisfied days toward coverage", () => {
    const p = getChallengeProgress(makeChallenge(), "2026-01-03", ["2026-01-09"]);
    expect(p.daysElapsed).toBe(3);
    expect(p.topicsCovered).toBe(0); // 2026-01-09 hasn't happened yet
  });

  it("clamps elapsed days after the challenge ends", () => {
    const p = getChallengeProgress(makeChallenge(), "2026-02-01");
    expect(p.daysElapsed).toBe(11);
    expect(p.percentElapsed).toBe(100);
    expect(p.isActiveToday).toBe(false);
  });
});

describe("isInsideAnyActiveChallenge", () => {
  it("is true inside, false outside, and ignores non-active challenges", () => {
    const c = makeChallenge();
    expect(isInsideAnyActiveChallenge("2026-01-05", [c])).toBe(true);
    expect(isInsideAnyActiveChallenge("2026-02-05", [c])).toBe(false);
    expect(
      isInsideAnyActiveChallenge("2026-01-05", [{ ...c, status: "Completed" }]),
    ).toBe(false);
  });
});

describe("getChallengeTracking", () => {
  it("computes check-in streak, done days, and completion %", () => {
    const t = getChallengeTracking(makeChallenge(), "2026-01-05", [
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
    expect(t.streak.count).toBe(3);
    expect(t.doneDays).toBe(3);
    expect(t.daysElapsedInWindow).toBe(5); // Jan 1..5 inclusive
    expect(t.completionPercent).toBe(60); // 3 / 5
  });

  it("ignores future check-ins and clamps the elapsed window", () => {
    const t = getChallengeTracking(makeChallenge(), "2026-01-03", ["2026-01-09"]);
    expect(t.doneDays).toBe(0);
    expect(t.daysElapsedInWindow).toBe(3);
    expect(t.completionPercent).toBe(0);
  });
});
