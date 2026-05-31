import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Numeral } from "@/components/ui/stat";
import type { StreakResult } from "@/lib/streaks";
import { cn } from "@/lib/utils";

export interface StreakCardData {
  key: string;
  label: string;
  cadenceLabel: string;
  result: StreakResult;
}

export function StreakCards({ items }: { items: StreakCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {items.map((item) => {
        const { count, unit, pendingCurrent } = item.result;
        const live = count > 0;
        return (
          <Card
            key={item.key}
            className="transition-shadow hover:ring-foreground/20"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">
                  {item.label}
                </span>
                <Flame
                  className={cn(
                    "size-4",
                    live
                      ? "text-primary ember-flicker"
                      : "text-muted-foreground/40",
                  )}
                />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <Numeral className="text-2xl font-semibold">{count}</Numeral>
                <span className="text-muted-foreground text-xs">
                  {unit === "weeks" ? "wk streak" : "day streak"}
                </span>
              </div>
              {pendingCurrent ? (
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary mt-2 text-[10px]"
                >
                  Log {unit === "weeks" ? "this week" : "today"} to extend
                </Badge>
              ) : (
                <p className="text-muted-foreground mt-2 truncate text-[10px]">
                  {item.cadenceLabel}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
