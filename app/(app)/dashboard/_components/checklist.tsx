"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { fireConfetti, isMilestone } from "@/components/celebrate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { GymStatus, HabitKey } from "@/lib/types";
import { setHabit } from "../actions";

type BoolHabit = "dsa" | "system_design" | "x" | "linkedin";

export interface ChecklistState {
  dsa: boolean;
  system_design: boolean;
  x: boolean;
  linkedin: boolean;
  gym: GymStatus | null;
}

export interface HabitStreakInfo {
  count: number;
  pendingCurrent: boolean;
  unit: "days" | "weeks";
}

const BOOL_ITEMS: { key: BoolHabit; label: string }[] = [
  { key: "dsa", label: "DSA done" },
  { key: "system_design", label: "System design studied" },
  { key: "x", label: "Posted on X" },
  { key: "linkedin", label: "Posted on LinkedIn" },
];

const GYM_CYCLE: (GymStatus | null)[] = [null, "went", "rest"];
const GYM_LABEL: Record<string, string> = {
  null: "Not logged",
  went: "Went 💪",
  rest: "Rest day 😴",
};

export function Checklist({
  today,
  initial,
  streaks,
}: {
  today: string;
  initial: ChecklistState;
  streaks?: Partial<Record<HabitKey, HabitStreakInfo>>;
}) {
  const [state, setState] = useState<ChecklistState>(initial);
  const [isPending, startTransition] = useTransition();

  // Celebrate only when marking done extends the streak into a milestone.
  function maybeCelebrate(key: HabitKey, label: string) {
    const s = streaks?.[key];
    if (s?.pendingCurrent && isMilestone(s.count + 1)) {
      void fireConfetti();
      toast.success(
        `🔥 ${s.count + 1} ${s.unit === "weeks" ? "weeks" : "days"} — ${label}!`,
      );
    }
  }

  function toggleBool(key: BoolHabit, label: string) {
    const next = !state[key];
    setState((s) => ({ ...s, [key]: next }));
    startTransition(async () => {
      const res = await setHabit(key as HabitKey, today, next);
      if (!res.ok) {
        setState((s) => ({ ...s, [key]: !next })); // revert
        toast.error(res.error);
        return;
      }
      if (next) maybeCelebrate(key as HabitKey, label);
    });
  }

  function cycleGym() {
    const prev = state.gym;
    const next = GYM_CYCLE[(GYM_CYCLE.indexOf(prev) + 1) % GYM_CYCLE.length];
    setState((s) => ({ ...s, gym: next }));
    startTransition(async () => {
      const res = await setHabit("gym", today, next);
      if (!res.ok) {
        setState((s) => ({ ...s, gym: prev }));
        toast.error(res.error);
        return;
      }
      if (next === "went") maybeCelebrate("gym", "Gym");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {BOOL_ITEMS.map((item) => (
          <label
            key={item.key}
            className="hover:bg-accent/50 flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <Checkbox
              checked={state[item.key]}
              onCheckedChange={() => toggleBool(item.key, item.label)}
              disabled={isPending}
            />
          </label>
        ))}

        <button
          type="button"
          onClick={cycleGym}
          disabled={isPending}
          className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors disabled:opacity-60"
        >
          <span className="text-sm font-medium">Gym</span>
          <span
            className={
              state.gym
                ? "text-sm font-medium"
                : "text-muted-foreground text-sm"
            }
          >
            {GYM_LABEL[String(state.gym)]}
          </span>
        </button>
        <p className="text-muted-foreground px-1 text-[11px]">
          Tap the gym row to cycle: not logged → went → rest. A rest day keeps
          your streak alive; an unlogged day breaks it.
        </p>
      </CardContent>
    </Card>
  );
}
