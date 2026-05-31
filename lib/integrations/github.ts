import "server-only";

import type { DayKey, GithubSnapshot } from "@/lib/types";

const GRAPHQL = "https://api.github.com/graphql";
const CONTRIB_QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

interface GhRepo {
  name: string;
  html_url: string;
  stargazers_count?: number;
  language?: string | null;
  description?: string | null;
}
interface GhEvent {
  type: string;
  repo?: { name?: string };
  created_at: string;
}

/**
 * Fetch a GitHub contribution calendar (GraphQL — the only source for the green
 * squares), recent repos and recent activity (REST). The `User-Agent` header is
 * mandatory. Throws on failure so the caller can fall back to a cached snapshot.
 */
export async function fetchGithub(
  login: string,
  token: string,
): Promise<GithubSnapshot> {
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "forge-app",
  };

  const gqlRes = await fetch(GRAPHQL, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ query: CONTRIB_QUERY, variables: { login } }),
    cache: "no-store",
  });
  const gql = await gqlRes.json();
  if (gql.errors || !gql.data?.user) {
    throw new Error(gql.errors?.[0]?.message ?? "GitHub user not found.");
  }
  const cal = gql.data.user.contributionsCollection.contributionCalendar;

  const valueByDay: Record<DayKey, number> = {};
  let endDay = "";
  for (const week of cal.weeks) {
    for (const day of week.contributionDays) {
      valueByDay[day.date] = day.contributionCount;
      if (day.date > endDay) endDay = day.date;
    }
  }

  const restHeaders = {
    ...authHeaders,
    Accept: "application/vnd.github+json",
  };

  const reposRes = await fetch(
    `https://api.github.com/users/${login}/repos?sort=updated&per_page=12&type=owner`,
    { headers: restHeaders, cache: "no-store" },
  );
  const reposJson: unknown = reposRes.ok ? await reposRes.json() : [];
  const repos = (Array.isArray(reposJson) ? (reposJson as GhRepo[]) : []).map(
    (r) => ({
      name: r.name,
      html_url: r.html_url,
      stargazers_count: r.stargazers_count ?? 0,
      language: r.language ?? null,
      description: r.description ?? null,
    }),
  );

  const eventsRes = await fetch(
    `https://api.github.com/users/${login}/events?per_page=20`,
    { headers: restHeaders, cache: "no-store" },
  );
  const eventsJson: unknown = eventsRes.ok ? await eventsRes.json() : [];
  const activity = (Array.isArray(eventsJson) ? (eventsJson as GhEvent[]) : [])
    .slice(0, 10)
    .map((e) => ({
      type: e.type,
      repo: e.repo?.name ?? null,
      created_at: e.created_at,
    }));

  return {
    totalContributions: cal.totalContributions,
    valueByDay,
    endDay,
    repos,
    activity,
  };
}

/** The login of the account the token belongs to (GET /user). */
export async function fetchViewerLogin(token: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "forge-app",
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.login as string | undefined) ?? null;
}
