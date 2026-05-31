/**
 * Shared domain types for Forge. Row shapes mirror the Supabase schema in
 * `supabase/migrations`. We hand-write these (rather than generating) to keep
 * the project dependency-light; regenerate with the Supabase CLI later if wanted.
 */

/** A calendar day, 'YYYY-MM-DD', always resolved in the user's timezone. */
export type DayKey = string;

export type HabitKey = "dsa" | "system_design" | "gym" | "x" | "linkedin";

export type GymStatus = "went" | "rest";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type ChallengeStatus = "Planned" | "Active" | "Completed" | "Abandoned";

/** A `cadence` challenge tracks daily check-ins; a `checklist` challenge tracks
 * completion of a fixed set of `challenge_items` (e.g. the SDE Sheet). */
export type ChallengeKind = "cadence" | "checklist";

export type ItemSource =
  | "leetcode"
  | "geeksforgeeks"
  | "interviewbit"
  | "codingninjas";

export type ProjectStatus = "Active" | "Shipped" | "Paused" | "Killed";

export interface ChallengeLog {
  id: string;
  user_id: string;
  challenge_id: string;
  date: DayKey;
  done: boolean;
  note: string | null;
  created_at: string;
}

// --- External integration snapshot payloads (cached in profile_snapshots) ---

export interface GithubRepo {
  name: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  description: string | null;
}

export interface GithubSnapshot {
  totalContributions: number;
  valueByDay: Record<DayKey, number>;
  endDay: DayKey;
  repos: GithubRepo[];
  activity: { type: string; repo: string | null; created_at: string }[];
}

export interface LeetcodeSnapshot {
  username: string;
  ranking: number | null;
  solved: { all: number; easy: number; medium: number; hard: number };
}

/** Per-day accepted-submission counts pulled from LeetCode's submission
 * calendar, keyed by DayKey in the user's timezone. Cached under
 * `profile_snapshots.source = 'leetcode_calendar'`. */
export interface LeetcodeCalendarSnapshot {
  countByDay: Record<DayKey, number>;
  syncedThroughDay: DayKey;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  timezone: string;
  github_username: string | null;
  leetcode_username: string | null;
  linkedin_url: string | null;
  x_handle: string | null;
  settings: Record<string, unknown>;
  public_handle: string | null;
  is_public: boolean;
  public_bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: DayKey;
  dsa_done: boolean;
  gym_status: GymStatus | null;
  system_design_done: boolean;
  posted_x: boolean;
  posted_linkedin: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DsaProblem {
  id: string;
  user_id: string;
  name: string;
  topic: string | null;
  difficulty: Difficulty | null;
  solved: boolean;
  notes: string | null;
  date: DayKey;
  source_label: string | null;
  problem_url: string | null;
  challenge_id: string | null;
  phase_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemDesignTopic {
  id: string;
  user_id: string;
  name: string;
  covered: boolean;
  covered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengePhase {
  id: string;
  user_id: string;
  challenge_id: string;
  name: string;
  duration_days: number;
  sort_order: number;
  topics: string[];
  created_at: string;
}

export interface ChallengeItem {
  id: string;
  user_id: string;
  challenge_id: string;
  section: string;
  sort_order: number;
  title: string;
  difficulty: Difficulty | null;
  url: string | null;
  source: ItemSource | null;
  external_ref: string | null;
  done: boolean;
  done_date: DayKey | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: DayKey | null;
  end_date: DayKey | null;
  status: ChallengeStatus;
  kind: ChallengeKind;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  /** Joined separately by query helpers; ordered by `sort_order`. */
  phases?: ChallengePhase[];
}

export interface SideProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  user_id: string;
  project_id: string;
  date: DayKey;
  note: string;
  sort_order: number;
  created_at: string;
}
