"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { SystemDesignTopic } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteTopic, setTopicCovered } from "../actions";

export function TopicRow({
  topic,
  today,
}: {
  topic: SystemDesignTopic;
  today: string;
}) {
  const [covered, setCovered] = useState(topic.covered);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !covered;
    setCovered(next);
    startTransition(async () => {
      const res = await setTopicCovered(topic.id, next, today);
      if (!res.ok) {
        setCovered(!next);
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!window.confirm(`Delete "${topic.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteTopic(topic.id);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="hover:bg-accent/40 flex items-center justify-between gap-3 rounded-md border p-3 transition-colors">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <Checkbox checked={covered} onCheckedChange={toggle} disabled={pending} />
        <span
          className={cn(
            "truncate text-sm",
            covered && "text-muted-foreground line-through",
          )}
        >
          {topic.name}
        </span>
      </label>
      <Button
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending}
        aria-label={`Delete ${topic.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
