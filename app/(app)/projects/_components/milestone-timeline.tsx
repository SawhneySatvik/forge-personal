"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ProjectMilestone } from "@/lib/types";
import { deleteMilestone } from "../actions";

export function MilestoneTimeline({
  milestones,
  projectId,
}: {
  milestones: ProjectMilestone[];
  projectId: string;
}) {
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    if (!window.confirm("Delete this milestone?")) return;
    startTransition(async () => {
      const res = await deleteMilestone(id, projectId);
      if (!res.ok) toast.error(res.error);
    });
  }

  if (!milestones.length) {
    return (
      <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
        No milestones yet — log your first one above.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {milestones.map((m) => (
        <li
          key={m.id}
          className="flex items-start justify-between gap-3 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {m.date}
            </p>
            <p className="mt-0.5 text-sm">{m.note}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(m.id)}
            disabled={pending}
            aria-label="Delete milestone"
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ol>
  );
}
