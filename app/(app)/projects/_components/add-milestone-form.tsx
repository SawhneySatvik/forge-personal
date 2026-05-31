"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMilestone } from "../actions";

export function AddMilestoneForm({
  projectId,
  today,
}: {
  projectId: string;
  today: string;
}) {
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Enter a milestone note.");
      return;
    }
    startTransition(async () => {
      const res = await addMilestone(projectId, { date, note: note.trim() });
      if (res.ok) {
        toast.success("Milestone added.");
        setNote("");
        setDate(today);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <Label htmlFor="m-date">Date</Label>
        <Input
          id="m-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="min-w-48 flex-1 space-y-1.5">
        <Label htmlFor="m-note">Milestone</Label>
        <Input
          id="m-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Shipped v1 · hit 100 users · refactored auth…"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
