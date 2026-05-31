import Link from "next/link";
import { Star } from "lucide-react";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Numeral } from "@/components/ui/stat";
import type { GithubSnapshot } from "@/lib/types";
import { RefreshButton } from "./refresh-button";

export function GithubCard({
  snapshot,
  hasUsername,
}: {
  snapshot: { payload: GithubSnapshot; fetchedAt: string } | null;
  hasUsername: boolean;
}) {
  const p = snapshot?.payload;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">GitHub</CardTitle>
          <RefreshButton source="github" fetchedAt={snapshot?.fetchedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {!hasUsername ? (
          <p className="text-muted-foreground text-sm">
            Add your GitHub username in{" "}
            <Link href="/settings" className="underline underline-offset-4">
              Settings
            </Link>
            .
          </p>
        ) : !p ? (
          <p className="text-muted-foreground text-sm">
            No data yet — click Refresh. (Requires a server-side GITHUB_TOKEN.)
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-baseline gap-2">
              <Numeral className="text-2xl font-semibold">
                {p.totalContributions}
              </Numeral>
              <span className="text-muted-foreground text-xs">
                contributions in the last year
              </span>
            </div>

            <HabitHeatmap
              mode="count"
              valueByDay={p.valueByDay}
              endDay={p.endDay}
              weeks={53}
              weekStartsOn={0}
            />

            {p.repos.length ? (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Recent repos
                </p>
                <ul className="divide-y">
                  {p.repos.map((r) => (
                    <li
                      key={r.name}
                      className="flex items-center justify-between gap-3 py-1.5 text-sm"
                    >
                      <a
                        href={r.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium underline-offset-4 hover:underline"
                      >
                        {r.name}
                      </a>
                      <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                        {r.language ? <span>{r.language}</span> : null}
                        <span className="flex items-center gap-0.5">
                          <Star className="size-3" />
                          <Numeral>{r.stargazers_count}</Numeral>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {p.activity.length ? (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Recent activity
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  {p.activity.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {a.type.replace(/Event$/, "")}
                        {a.repo ? ` · ${a.repo}` : ""}
                      </span>
                      <span className="font-mono tabular-nums">
                        {a.created_at.slice(0, 10)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
