"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { setHabit } from "@/app/(app)/dashboard/actions";
import { cn } from "@/lib/utils";

export interface SocialDay {
  date: string;
  dow: string;
  isToday: boolean;
  isFuture: boolean;
  posted_x: boolean;
  posted_linkedin: boolean;
  inChallenge: boolean;
}

type Platform = "x" | "linkedin";
const ROWS: { habit: Platform; label: string }[] = [
  { habit: "x", label: "X" },
  { habit: "linkedin", label: "LinkedIn" },
];

export function SocialWeekGrid({ days }: { days: SocialDay[] }) {
  const [state, setState] = useState<
    Record<string, { x: boolean; linkedin: boolean }>
  >(() =>
    Object.fromEntries(
      days.map((d) => [d.date, { x: d.posted_x, linkedin: d.posted_linkedin }]),
    ),
  );
  const [pending, startTransition] = useTransition();

  function toggle(date: string, habit: Platform) {
    const current = state[date]?.[habit] ?? false;
    const next = !current;
    setState((s) => ({ ...s, [date]: { ...s[date], [habit]: next } }));
    startTransition(async () => {
      const res = await setHabit(habit, date, next);
      if (!res.ok) {
        setState((s) => ({ ...s, [date]: { ...s[date], [habit]: current } }));
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground grid grid-cols-[5rem_repeat(7,1fr)] gap-1 text-center text-[10px]">
        <div />
        {days.map((d) => (
          <div
            key={d.date}
            className={cn(d.isToday && "text-foreground font-semibold")}
          >
            {d.dow}
          </div>
        ))}
      </div>

      {ROWS.map(({ habit, label }) => (
        <div
          key={habit}
          className="grid grid-cols-[5rem_repeat(7,1fr)] items-center gap-1"
        >
          <div className="text-xs font-medium">{label}</div>
          {days.map((d) => {
            const on = state[d.date]?.[habit] ?? false;
            const ringForX = habit === "x" && d.inChallenge;
            return (
              <button
                key={d.date}
                type="button"
                disabled={pending || d.isFuture}
                aria-pressed={on}
                aria-label={`${label} on ${d.date}`}
                onClick={() => toggle(d.date, habit)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md border text-xs transition-colors",
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent/50",
                  d.isFuture && "opacity-40",
                  ringForX && !on && "ring-primary/40 ring-1",
                )}
              >
                {on ? <Check className="size-4" /> : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
