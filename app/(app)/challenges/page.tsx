import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  getChecklistProgress,
  isChecklist,
  type ChecklistProgress,
} from "@/lib/challenges";
import { addDays, todayInTz } from "@/lib/date";
import {
  DEFAULT_TIMEZONE,
  getChallengeItems,
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

  // Checklist challenges show items-done progress instead of calendar progress.
  const checklistProgress: Record<string, ChecklistProgress> = {};
  await Promise.all(
    challenges.filter(isChecklist).map(async (c) => {
      checklistProgress[c.id] = getChecklistProgress(
        await getChallengeItems(c.id),
      );
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenges"
        description="Structured pushes — a checklist sheet or a daily-cadence streak."
      >
        <Button render={<Link href="/challenges/new" />} nativeButton={false}>
          <Plus className="size-4" /> New
        </Button>
      </PageHeader>

      {challenges.length === 0 ? (
        <EmptyState
          title="No challenges yet"
          description="Create one to structure a focused push."
        />
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
                    checklist={checklistProgress[c.id]}
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
