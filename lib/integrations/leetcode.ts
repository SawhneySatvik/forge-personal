import "server-only";

import type { LeetcodeSnapshot } from "@/lib/types";

const GRAPHQL = "https://leetcode.com/graphql";
const QUERY = `
query($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
}`;

/**
 * Fetch solved-by-difficulty from LeetCode's unofficial GraphQL endpoint.
 * Must be server-side (CORS) with a `Referer` header. Throws on failure.
 */
export async function fetchLeetcode(
  username: string,
): Promise<LeetcodeSnapshot> {
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent": "Mozilla/5.0 (forge-app)",
    },
    body: JSON.stringify({ query: QUERY, variables: { username } }),
    cache: "no-store",
  });
  const json = await res.json();
  const user = json?.data?.matchedUser;
  if (!user) throw new Error("LeetCode user not found or endpoint changed.");

  const by: Record<string, number> = {};
  for (const s of user.submitStatsGlobal.acSubmissionNum as {
    difficulty: string;
    count: number;
  }[]) {
    by[s.difficulty] = s.count;
  }

  return {
    username: user.username,
    ranking: user.profile?.ranking ?? null,
    solved: {
      all: by.All ?? 0,
      easy: by.Easy ?? 0,
      medium: by.Medium ?? 0,
      hard: by.Hard ?? 0,
    },
  };
}
