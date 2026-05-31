import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Numeral } from "@/components/ui/stat";
import type { LeetcodeSnapshot } from "@/lib/types";
import { LeetcodeDonut } from "./leetcode-donut";
import { RefreshButton } from "./refresh-button";

export function LeetcodeCard({
  snapshot,
  hasUsername,
}: {
  snapshot: { payload: LeetcodeSnapshot; fetchedAt: string } | null;
  hasUsername: boolean;
}) {
  const p = snapshot?.payload;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">LeetCode</CardTitle>
          <RefreshButton source="leetcode" fetchedAt={snapshot?.fetchedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {!hasUsername ? (
          <p className="text-muted-foreground text-sm">
            Add your LeetCode username in{" "}
            <Link href="/settings" className="underline underline-offset-4">
              Settings
            </Link>
            .
          </p>
        ) : !p ? (
          <p className="text-muted-foreground text-sm">
            No data yet — click Refresh.
          </p>
        ) : (
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <LeetcodeDonut solved={p.solved} />
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <Numeral className="text-3xl font-semibold">
                  {p.solved.all}
                </Numeral>
                <span className="text-muted-foreground text-xs">solved</span>
              </div>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-emerald-500">Easy</span>
                  <Numeral>{p.solved.easy}</Numeral>
                </li>
                <li className="flex justify-between">
                  <span className="text-amber-500">Medium</span>
                  <Numeral>{p.solved.medium}</Numeral>
                </li>
                <li className="flex justify-between">
                  <span className="text-rose-500">Hard</span>
                  <Numeral>{p.solved.hard}</Numeral>
                </li>
              </ul>
              {p.ranking ? (
                <p className="text-muted-foreground text-xs">
                  Rank <Numeral>{p.ranking}</Numeral>
                </p>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
