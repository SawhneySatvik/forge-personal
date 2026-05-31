"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { fireConfetti } from "@/components/celebrate";
import { Input } from "@/components/ui/input";
import { difficultyChipClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  batchToggleChallengeItems,
  toggleChallengeItem,
} from "../../actions";

export interface ChecklistRow {
  id: string;
  section: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  url: string | null;
  source: string | null;
  done: boolean;
}

const MILESTONES = [10, 25, 50, 75, 100, 125, 150, 175, 190];
type StatusFilter = "all" | "unsolved" | "solved";
type DiffFilter = "all" | "Easy" | "Medium" | "Hard";

export function SdeChecklist({ items: initial }: { items: ChecklistRow[] }) {
  const [items, setItems] = useState<ChecklistRow[]>(initial);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [diff, setDiff] = useState<DiffFilter>("all");
  const [query, setQuery] = useState("");

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;

  function celebrate(prev: number, next: number) {
    if (next <= prev) return;
    const hit = MILESTONES.find((m) => m > prev && m <= next);
    if (hit) {
      void fireConfetti();
      toast.success(`🔥 ${hit}/${total} solved!`);
    }
  }

  function setDone(ids: Set<string>, value: boolean) {
    setItems((prev) =>
      prev.map((i) => (ids.has(i.id) ? { ...i, done: value } : i)),
    );
  }

  function toggleOne(row: ChecklistRow) {
    const next = !row.done;
    const ids = new Set([row.id]);
    const before = doneCount;
    setDone(ids, next);
    startTransition(async () => {
      const res = await toggleChallengeItem(row.id, next);
      if (!res.ok) {
        setDone(ids, row.done);
        toast.error(res.error);
        return;
      }
      celebrate(before, before + (next ? 1 : -1));
    });
  }

  function markSection(section: string) {
    const ids = new Set(
      items.filter((i) => i.section === section && !i.done).map((i) => i.id),
    );
    if (ids.size === 0) return;
    const before = doneCount;
    setDone(ids, true);
    startTransition(async () => {
      const res = await batchToggleChallengeItems([...ids], true);
      if (!res.ok) {
        setDone(ids, false);
        toast.error(res.error);
        return;
      }
      celebrate(before, before + ids.size);
    });
  }

  // Group by section in first-seen order, applying filters.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const order: string[] = [];
    const map = new Map<string, ChecklistRow[]>();
    for (const it of items) {
      if (status === "solved" && !it.done) continue;
      if (status === "unsolved" && it.done) continue;
      if (diff !== "all" && it.difficulty !== diff) continue;
      if (q && !it.title.toLowerCase().includes(q)) continue;
      if (!map.has(it.section)) {
        map.set(it.section, []);
        order.push(it.section);
      }
      map.get(it.section)!.push(it);
    }
    return order.map((section) => ({ section, rows: map.get(section)! }));
  }, [items, status, diff, query]);

  // Per-section totals (unfiltered) for the section headers.
  const sectionTotals = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const it of items) {
      const s = m.get(it.section) ?? { done: 0, total: 0 };
      s.total += 1;
      if (it.done) s.done += 1;
      m.set(it.section, s);
    }
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="h-9 w-full sm:max-w-56"
        />
        <Segmented
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            ["all", "All"],
            ["unsolved", "To do"],
            ["solved", "Done"],
          ]}
        />
        <Segmented
          value={diff}
          onChange={(v) => setDiff(v as DiffFilter)}
          options={[
            ["all", "Any"],
            ["Easy", "Easy"],
            ["Medium", "Med"],
            ["Hard", "Hard"],
          ]}
        />
      </div>

      {sections.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
          No questions match these filters.
        </p>
      ) : (
        <div className="space-y-5">
          {sections.map(({ section, rows }) => {
            const totals = sectionTotals.get(section)!;
            const allDone = totals.done === totals.total;
            return (
              <section key={section}>
                <div className="bg-background/95 sticky top-14 z-10 -mx-1 flex items-center justify-between gap-2 px-1 py-1.5 backdrop-blur md:top-0">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{section}</h3>
                    <div className="bg-muted mt-1 h-1 w-28 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((totals.done / totals.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {totals.done}/{totals.total}
                    </span>
                    {!allDone ? (
                      <button
                        type="button"
                        onClick={() => markSection(section)}
                        disabled={pending}
                        className="text-muted-foreground hover:text-foreground rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50"
                      >
                        Mark all
                      </button>
                    ) : null}
                  </div>
                </div>

                <ul className="mt-1 divide-y rounded-lg border">
                  {rows.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 p-2.5">
                      <button
                        type="button"
                        onClick={() => toggleOne(row)}
                        disabled={pending}
                        aria-pressed={row.done}
                        aria-label={row.done ? "Mark not done" : "Mark solved"}
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
                          row.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:border-primary",
                        )}
                      >
                        {row.done ? <Check className="size-3.5" /> : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm",
                            row.done && "text-muted-foreground line-through",
                          )}
                        >
                          {row.title}
                        </p>
                      </div>
                      {row.difficulty ? (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            difficultyChipClass(row.difficulty),
                          )}
                        >
                          {row.difficulty}
                        </span>
                      ) : null}
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          aria-label="Open problem"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="bg-muted inline-flex rounded-lg p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
