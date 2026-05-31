"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setHabit } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import type { GymStatus } from "@/lib/types";

export function GymDayControl({
  today,
  initial,
}: {
  today: string;
  initial: GymStatus | null;
}) {
  const [status, setStatus] = useState<GymStatus | null>(initial);
  const [pending, startTransition] = useTransition();

  function set(next: GymStatus | null) {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const res = await setHabit("gym", today, next);
      if (!res.ok) {
        setStatus(prev);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={status === "went" ? "default" : "outline"}
        onClick={() => set("went")}
        disabled={pending}
      >
        Went 💪
      </Button>
      <Button
        variant={status === "rest" ? "default" : "outline"}
        onClick={() => set("rest")}
        disabled={pending}
      >
        Rest day 😴
      </Button>
      <Button
        variant="ghost"
        onClick={() => set(null)}
        disabled={pending || status === null}
      >
        Clear
      </Button>
    </div>
  );
}
