import { describe, expect, it } from "vitest";
import {
  consistencyScore30d,
  dsaByDifficulty,
  dsaByTopic,
  dsaCumulative,
  habitsCompletedByDay,
  perHabitStats,
} from "@/lib/analytics";
import { addDays } from "@/lib/date";
import type { DailyLog, DsaProblem } from "@/lib/types";

function log(date: string, p: Partial<DailyLog> = {}): DailyLog {
  return {
    id: date,
    user_id: "u",
    date,
    dsa_done: false,
    gym_status: null,
    system_design_done: false,
    posted_x: false,
    posted_linkedin: false,
    notes: null,
    created_at: "",
    updated_at: "",
    ...p,
  };
}

function prob(date: string, p: Partial<DsaProblem> = {}): DsaProblem {
  return {
    id: `${date}-${p.topic ?? ""}-${p.difficulty ?? ""}`,
    user_id: "u",
    name: "x",
    topic: null,
    difficulty: null,
    solved: true,
    notes: null,
    date,
    source_label: null,
    problem_url: null,
    challenge_id: null,
    phase_id: null,
    created_at: "",
    updated_at: "",
    ...p,
  };
}

describe("analytics", () => {
  it("habitsCompletedByDay counts 0..5", () => {
    const m = habitsCompletedByDay([
      log("2026-05-01", { dsa_done: true, gym_status: "went", posted_x: true }),
    ]);
    expect(m["2026-05-01"]).toBe(3);
  });

  it("dsaByDifficulty buckets Easy/Medium/Hard", () => {
    const r = dsaByDifficulty([
      prob("2026-05-01", { difficulty: "Easy" }),
      prob("2026-05-02", { difficulty: "Easy" }),
      prob("2026-05-03", { difficulty: "Hard" }),
    ]);
    expect(r.find((x) => x.difficulty === "Easy")?.count).toBe(2);
    expect(r.find((x) => x.difficulty === "Hard")?.count).toBe(1);
    expect(r.find((x) => x.difficulty === "Medium")?.count).toBe(0);
  });

  it("dsaCumulative accumulates by date", () => {
    const r = dsaCumulative([
      prob("2026-05-01"),
      prob("2026-05-01", { topic: "b" }),
      prob("2026-05-03"),
    ]);
    expect(r).toEqual([
      { date: "2026-05-01", total: 2 },
      { date: "2026-05-03", total: 3 },
    ]);
  });

  it("dsaByTopic sorts descending", () => {
    const r = dsaByTopic([
      prob("2026-05-01", { topic: "Arrays" }),
      prob("2026-05-02", { topic: "Arrays" }),
      prob("2026-05-03", { topic: "Trees" }),
    ]);
    expect(r[0]).toEqual({ topic: "Arrays", count: 2 });
  });

  it("consistencyScore30d is 100 when every habit is maxed", () => {
    const today = "2026-05-30";
    const logs: DailyLog[] = [];
    for (let i = 0; i < 30; i++) {
      logs.push(
        log(addDays(today, -i), {
          dsa_done: true,
          system_design_done: true,
          gym_status: "went",
          posted_x: true,
          posted_linkedin: true,
        }),
      );
    }
    expect(consistencyScore30d(logs, today)).toBe(100);
  });

  it("perHabitStats returns all five habits", () => {
    const stats = perHabitStats(
      [log("2026-05-30", { dsa_done: true })],
      "2026-05-30",
      [],
    );
    expect(stats).toHaveLength(5);
    expect(stats.find((s) => s.key === "dsa")?.current).toBe(1);
  });
});
