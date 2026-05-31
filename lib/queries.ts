import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Challenge,
  ChallengeItem,
  DailyLog,
  DayKey,
  Difficulty,
  DsaProblem,
  HabitKey,
  ChallengeLog,
  LeetcodeCalendarSnapshot,
  Profile,
  ProjectMilestone,
  SideProject,
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

/** Problems logged per day since `since` (for the DSA heatmap; avoids the 200-row list cap). */
export async function getDsaCountsByDay(
  since: DayKey,
): Promise<Record<DayKey, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dsa_problems")
    .select("date")
    .gte("date", since);
  const out: Record<DayKey, number> = {};
  for (const row of (data as { date: DayKey }[] | null) ?? []) {
    out[row.date] = (out[row.date] ?? 0) + 1;
  }
  return out;
}

/** Canonical items (questions) for a checklist challenge, in sheet order. */
export async function getChallengeItems(
  challengeId: string,
): Promise<ChallengeItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_items")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("sort_order", { ascending: true });
  return (data as ChallengeItem[] | null) ?? [];
}

/**
 * Merged DSA activity intensity per day for the heatmap. Per day:
 *   count = leetcodeCalendarCount ?? (manual dsa_problems + checklist items done)
 * LeetCode is authoritative when synced, so the same solve is never summed
 * twice across sources. Drives the `/dsa` heatmap.
 */
export async function getDsaHeatmap(
  since: DayKey,
): Promise<Record<DayKey, number>> {
  const supabase = await createClient();
  const [{ data: dsaRows }, { data: itemRows }, leetcode] = await Promise.all([
    supabase.from("dsa_problems").select("date").gte("date", since),
    supabase
      .from("challenge_items")
      .select("done_date")
      .eq("done", true)
      .gte("done_date", since),
    getLatestSnapshot<LeetcodeCalendarSnapshot>("leetcode_calendar"),
  ]);

  const local: Record<DayKey, number> = {};
  for (const row of (dsaRows as { date: DayKey }[] | null) ?? []) {
    local[row.date] = (local[row.date] ?? 0) + 1;
  }
  for (const row of (itemRows as { done_date: DayKey | null }[] | null) ?? []) {
    if (row.done_date) local[row.done_date] = (local[row.done_date] ?? 0) + 1;
  }

  const leetByDay = leetcode?.payload.countByDay ?? {};
  const out: Record<DayKey, number> = { ...local };
  for (const [day, count] of Object.entries(leetByDay)) {
    if (day >= since && count > 0) out[day] = count; // LeetCode wins when present
  }
  return out;
}

/** Daily check-in logs for one challenge, newest first. */
export async function getChallengeLogs(
  challengeId: string,
): Promise<ChallengeLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_logs")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("date", { ascending: false });
  return (data as ChallengeLog[] | null) ?? [];
}

export interface ProjectWithLastMilestone extends SideProject {
  milestones: Pick<ProjectMilestone, "date" | "note">[];
}

/** Projects (newest-updated first) each with their single most-recent milestone. */
export async function listProjectsWithLastMilestone(): Promise<
  ProjectWithLastMilestone[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("side_projects")
    .select("*, milestones:project_milestones(date, note)")
    .order("updated_at", { ascending: false })
    .order("date", { ascending: false, referencedTable: "project_milestones" })
    .limit(1, { referencedTable: "project_milestones" });
  return (data as ProjectWithLastMilestone[] | null) ?? [];
}

export interface ProjectWithMilestones extends SideProject {
  milestones: ProjectMilestone[];
}

export async function getProject(
  id: string,
): Promise<ProjectWithMilestones | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("side_projects")
    .select("*, milestones:project_milestones(*)")
    .eq("id", id)
    .maybeSingle();
  const project = (data as ProjectWithMilestones | null) ?? null;
  if (project) {
    project.milestones = (project.milestones ?? []).sort((a, b) =>
      a.date !== b.date
        ? b.date.localeCompare(a.date)
        : b.created_at.localeCompare(a.created_at),
    );
  }
  return project;
}

export async function getProfileUsernames(): Promise<{
  userId: string | null;
  github: string | null;
  leetcode: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("github_username, leetcode_username")
    .maybeSingle();
  return {
    userId: user?.id ?? null,
    github: data?.github_username ?? null,
    leetcode: data?.leetcode_username ?? null,
  };
}

/** Most recent cached integration snapshot for `source`, or null. */
export async function getLatestSnapshot<T>(
  source: "github" | "leetcode" | "leetcode_calendar",
): Promise<{ payload: T; fetchedAt: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_snapshots")
    .select("payload, fetched_at")
    .eq("source", source)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { payload: data.payload as T, fetchedAt: data.fetched_at as string };
}
