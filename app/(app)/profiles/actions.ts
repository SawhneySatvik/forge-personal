"use server";

import { revalidatePath } from "next/cache";
import { fetchGithub, fetchViewerLogin } from "@/lib/integrations/github";
import { fetchLeetcode, fetchLeetcodeCalendar } from "@/lib/integrations/leetcode";
import { submissionCalendarToCountByDay } from "@/lib/integrations/leetcode-shared";
import { todayInTz } from "@/lib/date";
import { DEFAULT_TIMEZONE } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type RefreshResult = { ok: true } | { ok: false; reason: string };

/** Fetch fresh data from GitHub/LeetCode and cache it in profile_snapshots. */
export async function refreshIntegration(
  source: "github" | "leetcode",
): Promise<RefreshResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username, leetcode_username")
    .maybeSingle();

  try {
    let payload: unknown;
    if (source === "github") {
      const token = process.env.GITHUB_TOKEN;
      if (!token)
        return { ok: false, reason: "GITHUB_TOKEN is not configured on the server." };
      let login = profile?.github_username ?? null;
      if (!login) {
        // Single-user app: fall back to the token's own account, and persist it.
        login = await fetchViewerLogin(token);
        if (!login)
          return {
            ok: false,
            reason: "Couldn't resolve a GitHub user from the token.",
          };
        await supabase
          .from("profiles")
          .update({ github_username: login })
          .eq("user_id", user.id);
      }
      payload = await fetchGithub(login, token);
    } else {
      const username = profile?.leetcode_username;
      if (!username)
        return { ok: false, reason: "Set your LeetCode username in Settings." };
      payload = await fetchLeetcode(username);
    }

    const { error } = await supabase
      .from("profile_snapshots")
      .insert({ user_id: user.id, source, payload });
    if (error) return { ok: false, reason: error.message };

    revalidatePath("/profiles");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Fetch failed.",
    };
  }
}

/**
 * Pull the LeetCode submission calendar and mark every day with an accepted
 * submission as DSA-done (daily_logs.dsa_done = true). Counts are cached under
 * profile_snapshots.source = 'leetcode_calendar' to feed the DSA heatmap.
 * Manual, idempotent (re-running only re-sets the same true days). Degrades
 * gracefully if the unofficial endpoint changes.
 */
export async function syncLeetcode(): Promise<RefreshResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("leetcode_username, timezone")
    .maybeSingle();
  const username = profile?.leetcode_username;
  if (!username)
    return { ok: false, reason: "Set your LeetCode username in Settings." };
  const tz = (profile?.timezone as string | undefined) ?? DEFAULT_TIMEZONE;

  try {
    const raw = await fetchLeetcodeCalendar(username);
    const countByDay = submissionCalendarToCountByDay(raw, tz);
    const days = Object.keys(countByDay).filter((d) => countByDay[d] > 0);

    if (days.length) {
      const rows = days.map((date) => ({
        user_id: user.id,
        date,
        dsa_done: true,
      }));
      const { error: dlErr } = await supabase
        .from("daily_logs")
        .upsert(rows, { onConflict: "user_id,date" });
      if (dlErr) return { ok: false, reason: dlErr.message };
    }

    const { error } = await supabase.from("profile_snapshots").insert({
      user_id: user.id,
      source: "leetcode_calendar",
      payload: { countByDay, syncedThroughDay: todayInTz(tz) },
    });
    if (error) return { ok: false, reason: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dsa");
    revalidatePath("/profiles");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Sync failed.",
    };
  }
}
