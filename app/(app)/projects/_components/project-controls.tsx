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
import type { ProjectStatus } from "@/lib/types";
import { deleteProject, setProjectStatus } from "../actions";

const STATUSES: ProjectStatus[] = ["Active", "Shipped", "Paused", "Killed"];

export function ProjectControls({
  id,
  status,
}: {
  id: string;
  status: ProjectStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(next: ProjectStatus) {
    if (next === status) return;
    startTransition(async () => {
      const res = await setProjectStatus(id, next);
      if (res.ok) toast.success(`Marked ${next}.`);
      else toast.error(res.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteProject(id);
      if (res.ok) {
        toast.success("Project deleted.");
        router.push("/projects");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => changeStatus(v as ProjectStatus)}>
        <SelectTrigger className="w-32">
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
        variant="outline"
        nativeButton={false}
        render={<Link href={`/projects/${id}/edit`} />}
      >
        <Pencil className="size-4" /> Edit
      </Button>

      <Dialog>
        <DialogTrigger render={<Button variant="ghost" />}>
          <Trash2 className="size-4" /> Delete
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>
              This removes the project and all its milestones.
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
