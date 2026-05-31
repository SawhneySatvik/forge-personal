"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { fireConfetti, isMilestone } from "@/components/celebrate";
import { Button } from "@/components/ui/button";
import { setChallengeDay } from "../actions";

export function ChallengeDayControl({
  challengeId,
  today,
  initialDone,
  streakCount,
  pendingToday,
}: {
  challengeId: string;
  today: string;
  initialDone: boolean;
  streakCount: number;
  pendingToday: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const res = await setChallengeDay(challengeId, today, next);
      if (!res.ok) {
        setDone(!next);
        toast.error(res.error);
        return;
      }
      if (next && pendingToday && isMilestone(streakCount + 1)) {
        void fireConfetti();
        toast.success(`🔥 ${streakCount + 1}-day challenge streak!`);
      }
    });
  }

  return (
    <Button
      variant={done ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
      size="sm"
    >
      <Check className="size-4" />
      {done ? "Done today" : "Mark today done"}
    </Button>
  );
}
