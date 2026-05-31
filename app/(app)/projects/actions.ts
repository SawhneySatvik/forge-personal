"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDayKey } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

const STATUSES = ["Active", "Shipped", "Paused", "Killed"] as const;

export interface ProjectInput {
  name: string;
  description?: string | null;
  status: ProjectStatus;
  tags: string[];
}

const ProjectSchema = z.object({
  name: z.string().min(1, "Enter a project name."),
  description: z.string().nullable().optional(),
  status: z.enum(STATUSES),
  tags: z.array(z.string().min(1)).max(20),
});

export async function createProject(
  input: ProjectInput,
): Promise<CreateResult> {
  const parsed = ProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("side_projects")
    .insert({
      user_id: userId,
      name: v.name,
      description: v.description ?? null,
      status: v.status,
      tags: v.tags,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  return { ok: true, id: data.id as string };
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ActionResult> {
  const parsed = ProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("side_projects")
    .update({
      name: v.name,
      description: v.description ?? null,
      status: v.status,
      tags: v.tags,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function setProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  const { error } = await supabase
    .from("side_projects")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  const { error } = await supabase.from("side_projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/projects");
  return { ok: true };
}

export interface MilestoneInput {
  date: string;
  note: string;
}

const MilestoneSchema = z.object({
  date: z.string().refine(isDayKey, "Invalid date."),
  note: z.string().min(1, "Enter a milestone note."),
});

export async function addMilestone(
  projectId: string,
  input: MilestoneInput,
): Promise<CreateResult> {
  const parsed = MilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      user_id: userId,
      project_id: projectId,
      date: v.date,
      note: v.note,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Bump the project's updated_at so the board re-sorts.
  await supabase
    .from("side_projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { ok: true, id: data.id as string };
}

export async function deleteMilestone(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  const { error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
