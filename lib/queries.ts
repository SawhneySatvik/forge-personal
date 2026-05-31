import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Challenge,
  DailyLog,
  DayKey,
  Difficulty,
  DsaProblem,
  HabitKey,
  Profile,
  SystemDesignTopic,
} from "@/lib/types";
import type { DayRecord } from "@/lib/streaks";

/** Default timezone if the profile row is missing (single-user app, India). */
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return (data as Profile | null) ?? null;
}

/** All daily_logs on or after `since`, newest first. */
export async function getDailyLogsSince(since: DayKey): Promise<DailyLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("date", since)
    .order("date", { ascending: false });
  return (data as DailyLog[] | null) ?? [];
}

export async function getDailyLog(date: DayKey): Promise<DailyLog | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return (data as DailyLog | null) ?? null;
}

/** Active challenges with their phases embedded (ordered by sort_order). */
export async function getActiveChallenges(): Promise<Challenge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*, phases:challenge_phases(*)")
    .eq("status", "Active");
  const challenges = (data as Challenge[] | null) ?? [];
  for (const c of challenges) {
    c.phases = (c.phases ?? []).sort((a, b) => a.sort_order - b.sort_order);
  }
  return challenges;
}

export async function getTodayDsaProblems(today: DayKey): Promise<DsaProblem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dsa_problems")
    .select("*")
    .eq("date", today)
    .order("created_at", { ascending: false });
  return (data as DsaProblem[] | null) ?? [];
}

export interface DsaFilters {
  topic?: string;
  difficulty?: Difficulty;
  solvedOnly?: boolean;
  limit?: number;
}

export async function listDsaProblems(
  filters: DsaFilters = {},
): Promise<DsaProblem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("dsa_problems")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.topic) query = query.ilike("topic", `%${filters.topic}%`);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.solvedOnly) query = query.eq("solved", true);
  query = query.limit(filters.limit ?? 200);

  const { data } = await query;
  return (data as DsaProblem[] | null) ?? [];
}

/**
 * Project the wide daily_logs rows into the per-habit `DayRecord[]` the streak
 * engine consumes. Only days where the habit was actually recorded appear; the
 * absence of a record is what the engine reads as a break.
 */
export function habitRecords(logs: DailyLog[], habit: HabitKey): DayRecord[] {
  const records: DayRecord[] = [];
  for (const log of logs) {
    switch (habit) {
      case "dsa":
        if (log.dsa_done) records.push({ day: log.date, status: "done" });
        break;
      case "system_design":
        if (log.system_design_done)
          records.push({ day: log.date, status: "done" });
        break;
      case "gym":
        if (log.gym_status)
          records.push({
            day: log.date,
            status: log.gym_status === "went" ? "done" : "rest",
          });
        break;
      case "x":
        if (log.posted_x) records.push({ day: log.date, status: "done" });
        break;
      case "linkedin":
        if (log.posted_linkedin)
          records.push({ day: log.date, status: "done" });
        break;
    }
  }
  return records;
}

export async function listSystemDesignTopics(): Promise<SystemDesignTopic[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_design_topics")
    .select("*")
    .order("covered", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as SystemDesignTopic[] | null) ?? [];
}

/** All challenges with phases embedded, newest start_date first. */
export async function listChallenges(): Promise<Challenge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*, phases:challenge_phases(*)")
    .order("start_date", { ascending: false, nullsFirst: false });
  const challenges = (data as Challenge[] | null) ?? [];
  for (const c of challenges) {
    c.phases = (c.phases ?? []).sort((a, b) => a.sort_order - b.sort_order);
  }
  return challenges;
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*, phases:challenge_phases(*)")
    .eq("id", id)
    .maybeSingle();
  const challenge = (data as Challenge | null) ?? null;
  if (challenge) {
    challenge.phases = (challenge.phases ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
  }
  return challenge;
}
