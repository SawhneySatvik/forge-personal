import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getDailyLogsSince,
  getProfile,
  habitRecords,
  listChallenges,
} from "@/lib/queries";
import type { ChallengeStatus } from "@/lib/types";
import { ChallengeCard } from "./_components/challenge-card";

const ORDER: ChallengeStatus[] = [
  "Active",
  "Planned",
  "Completed",
  "Abandoned",
];

export default async function ChallengesPage() {
  const profile = await getProfile();
  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);
  const [challenges, logs] = await Promise.all([
    listChallenges(),
    getDailyLogsSince(addDays(today, -400)),
  ]);
  const dsaDays = habitRecords(logs, "dsa").map((r) => r.day);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Challenges</h1>
          <p className="text-muted-foreground text-sm">
            Structured, multi-phase pushes. Define phases and topics as data.
          </p>
        </div>
        <Button render={<Link href="/challenges/new" />} nativeButton={false}>
          <Plus className="size-4" /> New
        </Button>
      </div>

      {challenges.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
          No challenges yet. Create one to structure a focused push.
        </p>
      ) : (
        ORDER.map((status) => {
          const group = challenges.filter((c) => c.status === status);
          if (group.length === 0) return null;
          return (
            <section key={status} className="space-y-2">
              <h2 className="text-muted-foreground text-sm font-medium">
                {status}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    today={today}
                    satisfiedDays={dsaDays}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
