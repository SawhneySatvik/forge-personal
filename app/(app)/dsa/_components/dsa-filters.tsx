"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export function DsaFilters({
  initial,
}: {
  initial: { topic?: string; difficulty?: string; solvedOnly?: boolean };
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(initial.topic ?? "");
  const [difficulty, setDifficulty] = useState<string>(
    initial.difficulty ?? "any",
  );
  const [solvedOnly, setSolvedOnly] = useState(Boolean(initial.solvedOnly));

  function apply() {
    const params = new URLSearchParams();
    if (topic.trim()) params.set("topic", topic.trim());
    if (difficulty && difficulty !== "any") params.set("difficulty", difficulty);
    if (solvedOnly) params.set("solved", "1");
    const qs = params.toString();
    router.push(qs ? `/dsa?${qs}` : "/dsa");
  }

  function clear() {
    setTopic("");
    setDifficulty("any");
    setSolvedOnly(false);
    router.push("/dsa");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="filter-topic">Topic</Label>
        <Input
          id="filter-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Search topic…"
          className="w-44"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Difficulty</Label>
        <Select
          value={difficulty}
          onValueChange={(v) => setDifficulty(v ?? "any")}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex h-9 items-center gap-2 text-sm">
        <Checkbox
          checked={solvedOnly}
          onCheckedChange={(c) => setSolvedOnly(c === true)}
        />
        Solved only
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
