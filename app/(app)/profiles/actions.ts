"use server";

import { revalidatePath } from "next/cache";
import { fetchGithub } from "@/lib/integrations/github";
import { fetchLeetcode } from "@/lib/integrations/leetcode";
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
      const login = profile?.github_username;
      if (!login) return { ok: false, reason: "Set your GitHub username in Settings." };
      const token = process.env.GITHUB_TOKEN;
      if (!token)
        return { ok: false, reason: "GITHUB_TOKEN is not configured on the server." };
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
