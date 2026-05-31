"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDays } from "@/lib/date";
import type { Challenge, ChallengeStatus } from "@/lib/types";
import {
  createChallenge,
  updateChallenge,
  type ChallengeInput,
} from "../actions";

interface PhaseDraft {
  key: string;
  name: string;
  duration: string;
  topics: string;
}

const STATUSES: ChallengeStatus[] = [
  "Planned",
  "Active",
  "Completed",
  "Abandoned",
];

export function ChallengePhaseEditor({
  mode,
  challenge,
}: {
  mode: "create" | "edit";
  challenge?: Challenge;
}) {
  const router = useRouter();
  const [name, setName] = useState(challenge?.name ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");
  const [startDate, setStartDate] = useState(challenge?.start_date ?? "");
  const [status, setStatus] = useState<ChallengeStatus>(
    challenge?.status ?? "Planned",
  );
  const [phases, setPhases] = useState<PhaseDraft[]>(() =>
    challenge?.phases?.length
      ? challenge.phases.map((p) => ({
          key: p.id,
          name: p.name,
          duration: String(p.duration_days),
          topics: p.topics.join("\n"),
        }))
      : [{ key: "p0", name: "", duration: "7", topics: "" }],
  );
  const [pending, startTransition] = useTransition();

  const totalDays = phases.reduce(
    (s, p) => s + (parseInt(p.duration, 10) || 0),
    0,
  );
  const endDate =
    startDate && totalDays > 0 ? addDays(startDate, totalDays - 1) : null;

  function patchPhase(key: string, patch: Partial<PhaseDraft>) {
    setPhases((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }
  function addPhase() {
    setPhases((ps) => [
      ...ps,
      { key: crypto.randomUUID(), name: "", duration: "7", topics: "" },
    ]);
  }
  function removePhase(key: string) {
    setPhases((ps) => ps.filter((p) => p.key !== key));
  }
  function move(key: string, dir: -1 | 1) {
    setPhases((ps) => {
      const i = ps.findIndex((p) => p.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ps.length) return ps;
      const copy = [...ps];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function submit() {
    const input: ChallengeInput = {
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      status,
      phases: phases
        .map((p) => ({
          name: p.name.trim(),
          duration_days: parseInt(p.duration, 10) || 0,
          topics: p.topics
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean),
        }))
        .filter((p) => p.name),
    };
    if (!input.name) {
      toast.error("Enter a challenge name.");
      return;
    }
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createChallenge(input)
          : await updateChallenge(challenge!.id, input);
      if (res.ok) {
        toast.success(mode === "create" ? "Challenge created." : "Saved.");
        const id = "id" in res ? res.id : challenge!.id;
        router.push(`/challenges/${id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Challenge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="TakeUForward SDE Sheet (45 Days)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea
              id="c-desc"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-start">Start date</Label>
              <Input
                id="c-start"
                type="date"
                value={startDate ?? ""}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ChallengeStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {status === "Active" ? (
            <p className="text-muted-foreground text-xs">
              Setting this Active will move any other Active challenge back to
              Planned.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Phases</CardTitle>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {totalDays} days{endDate ? ` · ends ${endDate}` : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {phases.map((p, i) => (
            <div key={p.key} className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  Phase {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(p.key, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(p.key, 1)}
                    disabled={i === phases.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removePhase(p.key)}
                    disabled={phases.length === 1}
                    aria-label="Remove phase"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <div className="space-y-1.5">
                  <Label>Phase name</Label>
                  <Input
                    value={p.name}
                    onChange={(e) => patchPhase(p.key, { name: e.target.value })}
                    placeholder="Arrays"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={p.duration}
                    onChange={(e) =>
                      patchPhase(p.key, { duration: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Topics (one per line)</Label>
                <Textarea
                  value={p.topics}
                  onChange={(e) => patchPhase(p.key, { topics: e.target.value })}
                  rows={3}
                  placeholder={"Two pointers\nKadane / max subarray"}
                />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addPhase} className="w-full">
            <Plus className="size-4" /> Add phase
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create challenge"
              : "Save changes"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
