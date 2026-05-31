"use client";

import { useActionState, useEffect } from "react";
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

export function QuickLogDsa({
  today,
  challengeId,
}: {
  today: string;
  challengeId?: string | null;
}) {
  const [state, formAction, pending] = useActionState(logDsaProblem, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Problem logged.");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Remounting the form on each successful log (keyed by the new row id) resets
  // every field — including Base UI Select/Checkbox, which ignore form.reset().
  const formKey = state?.ok && state.id ? state.id : "new";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick-log a DSA problem</CardTitle>
        <CardDescription>Logging a problem marks DSA done today.</CardDescription>
      </CardHeader>
      <CardContent>
        <form key={formKey} action={formAction} className="space-y-3">
          <input type="hidden" name="date" value={today} />
          {challengeId ? (
            <input type="hidden" name="challenge_id" value={challengeId} />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Problem</Label>
              <Input id="name" name="name" required placeholder="Two Sum" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" name="topic" placeholder="Arrays" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select name="difficulty">
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
