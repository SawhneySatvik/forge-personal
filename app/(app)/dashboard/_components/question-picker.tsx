"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { difficultyChipClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export interface SheetItem {
  id: string;
  title: string;
  url: string | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  section: string;
}

/**
 * Type-ahead over the SDE-sheet questions. Picking one auto-fills the log form
 * (name/link/difficulty/topic) and tags it with the canonical item id.
 */
export function QuestionPicker({
  items,
  onPick,
}: {
  items: SheetItem[];
  onPick: (item: SheetItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.section.toLowerCase().includes(q),
        )
      : items;
    return base.slice(0, 12);
  }, [query, items]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Pick from the SDE sheet…"
          className="pl-8"
        />
      </div>
      {open && matches.length ? (
        <ul className="bg-popover text-popover-foreground absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border p-1 shadow-md">
          {matches.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                // onMouseDown beats the input's onBlur so the pick registers.
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(it);
                  setQuery("");
                  setOpen(false);
                }}
                className="hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate">{it.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {it.section}
                  </span>
                </span>
                {it.difficulty ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      difficultyChipClass(it.difficulty),
                    )}
                  >
                    {it.difficulty}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
