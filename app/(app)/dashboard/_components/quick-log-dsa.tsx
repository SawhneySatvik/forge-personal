"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { logDsaProblem } from "../actions";
import { QuestionPicker, type SheetItem } from "./question-picker";

const EMPTY = { name: "", topic: "", difficulty: "", url: "", itemId: "" };

export function QuickLogDsa({
  today,
  challengeId,
  sheetItems = [],
}: {
  today: string;
  challengeId?: string | null;
  sheetItems?: SheetItem[];
}) {
  const [state, formAction, pending] = useActionState(logDsaProblem, null);

  useEffect(() => {
    if (state?.ok) toast.success("Problem logged.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  // Remount the inner form on each success (keyed by the new id) — this resets
  // every field, including the controlled inputs and the Base UI Select/Checkbox
  // (which ignore form.reset()), without setState-in-effect.
  const formKey = state?.ok && state.id ? state.id : "new";

  return (
    <QuickLogForm
      key={formKey}
      today={today}
      challengeId={challengeId}
      sheetItems={sheetItems}
      formAction={formAction}
      pending={pending}
    />
  );
}

function QuickLogForm({
  today,
  challengeId,
  sheetItems,
  formAction,
  pending,
}: {
  today: string;
  challengeId?: string | null;
  sheetItems: SheetItem[];
  formAction: (payload: FormData) => void;
  pending: boolean;
}) {
  // Controlled so the SDE picker can auto-fill name/topic/difficulty/link.
  const [fields, setFields] = useState(EMPTY);

  function pick(item: SheetItem) {
    setFields({
      name: item.title,
      topic: item.section,
      difficulty: item.difficulty ?? "",
      url: item.url ?? "",
      itemId: item.id,
    });
  }

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    // Editing any field by hand detaches it from the picked sheet item.
    setFields((f) => ({ ...f, [key]: value, itemId: "" }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick-log a DSA problem</CardTitle>
        <CardDescription>Logging a problem marks DSA done today.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="date" value={today} />
          {challengeId ? (
            <input type="hidden" name="challenge_id" value={challengeId} />
          ) : null}
          <input type="hidden" name="item_id" value={fields.itemId} />

          {sheetItems.length ? (
            <QuestionPicker items={sheetItems} onPick={pick} />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Problem</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Two Sum"
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="Arrays"
                value={fields.topic}
                onChange={(e) => set("topic", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                name="difficulty"
                value={fields.difficulty}
                onValueChange={(v) => set("difficulty", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="problem_url">Link</Label>
              <Input
                id="problem_url"
                name="problem_url"
                type="url"
                placeholder="https://…"
                value={fields.url}
                onChange={(e) => set("url", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Approach, gotchas…" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="solved" defaultChecked />
            Solved it
          </label>

          <Button type="submit" disabled={pending}>
            {pending ? "Logging…" : "Log problem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
