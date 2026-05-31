"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { refreshIntegration } from "../actions";

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function RefreshButton({
  source,
  fetchedAt,
}: {
  source: "github" | "leetcode";
  fetchedAt?: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const res = await refreshIntegration(source);
      if (res.ok) toast.success("Refreshed.");
      else toast.error(res.reason);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {fetchedAt ? (
        <span className="text-muted-foreground text-[10px]">
          {relative(fetchedAt)}
        </span>
      ) : null}
      <Button variant="ghost" size="sm" onClick={refresh} disabled={pending}>
        <RefreshCw className={cn("size-4", pending && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );
}
