"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncLeetcode } from "@/app/(app)/profiles/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Pull the LeetCode submission calendar and mark every solved day as DSA-done.
 * Surfaced on /dsa and /profiles.
 */
export function SyncLeetcodeButton({
  label = "Sync LeetCode",
  variant = "outline",
  size = "sm",
}: {
  label?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
}) {
  const [pending, startTransition] = useTransition();

  function sync() {
    startTransition(async () => {
      const res = await syncLeetcode();
      if (res.ok) toast.success("LeetCode synced — solved days counted.");
      else toast.error(res.reason);
    });
  }

  return (
    <Button variant={variant} size={size} onClick={sync} disabled={pending}>
      <RefreshCw className={cn("size-4", pending && "animate-spin")} />
      {pending ? "Syncing…" : label}
    </Button>
  );
}
