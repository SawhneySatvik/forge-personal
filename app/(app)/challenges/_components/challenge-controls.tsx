"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Globe, Link2, Lock, Pencil, Trash2 } from "lucide-react";
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
import {
  deleteChallenge,
  setChallengePublic,
  setChallengeStatus,
} from "../actions";

const STATUSES: ChallengeStatus[] = [
  "Planned",
  "Active",
  "Completed",
  "Abandoned",
];

export function ChallengeControls({
  id,
  status,
  isPublic: initialPublic,
}: {
  id: string;
  status: ChallengeStatus;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(initialPublic);

  function changeStatus(next: ChallengeStatus) {
    if (next === status) return;
    startTransition(async () => {
      const res = await setChallengeStatus(id, next);
      if (res.ok) toast.success(`Marked ${next}.`);
      else toast.error(res.error);
    });
  }

  function togglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      const res = await setChallengePublic(id, next);
      if (!res.ok) {
        setIsPublic(!next);
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Challenge is now public." : "Challenge is private.");
    });
  }

  function copyLink() {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    void navigator.clipboard
      .writeText(`${base}/share/c/${id}`)
      .then(() => toast.success("Share link copied."));
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

      <Button
        variant={isPublic ? "default" : "outline"}
        onClick={togglePublic}
        disabled={pending}
      >
        {isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
        {isPublic ? "Public" : "Private"}
      </Button>

      {isPublic ? (
        <Button variant="ghost" onClick={copyLink}>
          <Link2 className="size-4" /> Copy link
        </Button>
      ) : null}

      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href={`/challenges/${id}/edit`} />}
      >
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
