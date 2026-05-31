"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectStatus, SideProject } from "@/lib/types";
import { createProject, updateProject, type ProjectInput } from "../actions";

const STATUSES: ProjectStatus[] = ["Active", "Shipped", "Paused", "Killed"];

export function ProjectForm({
  mode,
  project,
}: {
  mode: "create" | "edit";
  project?: SideProject;
}) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "Active",
  );
  const [tags, setTags] = useState((project?.tags ?? []).join(", "));
  const [pending, startTransition] = useTransition();

  function submit() {
    const input: ProjectInput = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (!input.name) {
      toast.error("Enter a project name.");
      return;
    }
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProject(input)
          : await updateProject(project!.id, input);
      if (res.ok) {
        toast.success(mode === "create" ? "Project created." : "Saved.");
        router.push(`/projects/${"id" in res ? res.id : project!.id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Forge"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-desc">One-line description</Label>
          <Textarea
            id="p-desc"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProjectStatus)}
            >
              <SelectTrigger className="w-full">
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-tags">Tags (comma-separated)</Label>
            <Input
              id="p-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="nextjs, supabase"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={pending}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create project"
                : "Save changes"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
