"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChallengeStatus } from "@/lib/types";
import { deleteChallenge, setChallengeStatus } from "../actions";

const STATUSES: ChallengeStatus[] = [
  "Planned",
  "Active",
  "Completed",
  "Abandoned",
];

export function ChallengeControls({
  id,
  status,
}: {
  id: string;
  status: ChallengeStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(next: ChallengeStatus) {
    if (next === status) return;
    startTransition(async () => {
      const res = await setChallengeStatus(id, next);
      if (res.ok) toast.success(`Marked ${next}.`);
      else toast.error(res.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteChallenge(id);
      if (res.ok) {
        toast.success("Challenge deleted.");
        router.push("/challenges");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => changeStatus(v as ChallengeStatus)}>
        <SelectTrigger className="w-36">
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

      <Button variant="outline" render={<Link href={`/challenges/${id}/edit`} />}>
        <Pencil className="size-4" /> Edit
      </Button>

      <Dialog>
        <DialogTrigger render={<Button variant="ghost" />}>
          <Trash2 className="size-4" /> Delete
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this challenge?</DialogTitle>
            <DialogDescription>
              This removes the challenge and its phases. Logged DSA problems are
              kept — they just lose their phase link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
