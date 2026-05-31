import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Challenge,
  ChallengeItem,
  ChallengeLog,
  DayKey,
} from "@/lib/types";

/**
 * Anonymous-safe reads for the public sharing pages (`/u/[handle]`,
 * `/share/c/[id]`). These rely entirely on the anon-read RLS policies added in
 * migration 0006 (gated on `is_public = true`) — there is no service-role key,
 * so Postgres, not app code, enforces what an anonymous visitor can see. We
 * never read `daily_logs`, `dsa_problems` or `profile_snapshots` here.
 */

/** A deliberately narrow public view of a profile. */
export interface PublicProfile {
  user_id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
}

export async function getPublicProfile(
  handle: string,
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("user_id, public_handle, display_name, public_bio, is_public")
    .ilike("public_handle", handle)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;
  return {
    user_id: data.user_id as string,
    handle: data.public_handle as string,
    display_name: (data.display_name as string | null) ?? null,
    bio: (data.public_bio as string | null) ?? null,
  };
}

/** Public challenges for a user, newest-updated first (RLS already gates is_public). */
export async function getPublicChallengesForUser(
  userId: string,
): Promise<Challenge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });
  return (data as Challenge[] | null) ?? [];
}

/** A single public challenge by id, or null if missing / private. */
export async function getPublicChallenge(
  id: string,
): Promise<Challenge | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("*, phases:challenge_phases(*)")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  const challenge = (data as Challenge | null) ?? null;
  if (challenge) {
    challenge.phases = (challenge.phases ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
  }
  return challenge;
}

export async function getPublicChallengeItems(
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

export async function getPublicChallengeLogs(
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

/** Item done-dates → per-day count, for the public checklist heatmap. */
export function itemDoneCountsByDay(
  items: ChallengeItem[],
): Record<DayKey, number> {
  const out: Record<DayKey, number> = {};
  for (const it of items) {
    if (it.done && it.done_date) {
      out[it.done_date] = (out[it.done_date] ?? 0) + 1;
    }
  }
  return out;
}
