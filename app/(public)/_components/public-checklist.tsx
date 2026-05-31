import { Check } from "lucide-react";
import type { ChallengeItem } from "@/lib/types";
import { difficultyChipClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Read-only, grouped view of a checklist challenge's items for public pages. */
export function PublicChecklist({ items }: { items: ChallengeItem[] }) {
  const order: string[] = [];
  const map = new Map<string, ChallengeItem[]>();
  for (const it of items) {
    if (!map.has(it.section)) {
      map.set(it.section, []);
      order.push(it.section);
    }
    map.get(it.section)!.push(it);
  }

  return (
    <div className="space-y-5">
      {order.map((section) => {
        const rows = map.get(section)!;
        const done = rows.filter((r) => r.done).length;
        return (
          <section key={section}>
            <div className="flex items-center justify-between py-1.5">
              <h3 className="text-sm font-semibold">{section}</h3>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {done}/{rows.length}
              </span>
            </div>
            <ul className="divide-y rounded-lg border">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-2.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border",
                      r.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {r.done ? <Check className="size-3.5" /> : null}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      r.done && "text-muted-foreground line-through",
                    )}
                  >
                    {r.title}
                  </span>
                  {r.difficulty ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        difficultyChipClass(r.difficulty),
                      )}
                    >
                      {r.difficulty}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
