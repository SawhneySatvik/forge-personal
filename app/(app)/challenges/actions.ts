"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, isDayKey } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeStatus } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export interface PhaseInput {
  name: string;
  duration_days: number;
  topics: string[];
}

export interface ChallengeInput {
  name: string;
  description?: string | null;
  start_date?: string | null;
  status: ChallengeStatus;
  phases: PhaseInput[];
}

const Schema = z.object({
  name: z.string().min(1, "Enter a challenge name."),
  description: z.string().nullable().optional(),
  start_date: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || isDayKey(v), "Invalid start date."),
  status: z.enum(["Planned", "Active", "Completed", "Abandoned"]),
  phases: z.array(
    z.object({
      name: z.string().min(1),
      duration_days: z.number().int().min(0),
      topics: z.array(z.string()),
    }),
  ),
});

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

// Single-active rule: only one challenge is Active at a time (drives the X
// cadence + dashboard banner). Demote any other Active challenge to Planned.
async function demoteOtherActive(
  supabase: SupabaseClient,
  exceptId: string | null,
) {
  let q = supabase
    .from("challenges")
    .update({ status: "Planned" })
    .eq("status", "Active");
  if (exceptId) q = q.neq("id", exceptId);
  await q;
}

function endDateFor(
  startDate: string | null | undefined,
  phases: PhaseInput[],
): string | null {
  const total = phases.reduce((s, p) => s + p.duration_days, 0);
  return startDate && total > 0 ? addDays(startDate, total - 1) : null;
}

export async function createChallenge(
  input: ChallengeInput,
): Promise<CreateResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  if (v.status === "Active") await demoteOtherActive(supabase, null);

  const { data: chal, error } = await supabase
    .from("challenges")
    .insert({
      user_id: userId,
      name: v.name,
      description: v.description ?? null,
      start_date: v.start_date || null,
      end_date: endDateFor(v.start_date, v.phases),
      status: v.status,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (v.phases.length) {
    const rows = v.phases.map((p, i) => ({
      user_id: userId,
      challenge_id: chal.id,
      name: p.name,
      duration_days: p.duration_days,
      sort_order: i,
      topics: p.topics,
    }));
    const { error: pErr } = await supabase.from("challenge_phases").insert(rows);
    if (pErr) return { ok: false, error: pErr.message };
  }

  revalidatePath("/challenges");
  revalidatePath("/dashboard");
  return { ok: true, id: chal.id as string };
}

export async function updateChallenge(
  id: string,
  input: ChallengeInput,
): Promise<ActionResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  if (v.status === "Active") await demoteOtherActive(supabase, id);

  const { error } = await supabase
    .from("challenges")
    .update({
      name: v.name,
      description: v.description ?? null,
      start_date: v.start_date || null,
      end_date: endDateFor(v.start_date, v.phases),
      status: v.status,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Phase sync: delete + re-insert. Safe because dsa_problems.phase_id is
  // ON DELETE SET NULL, so logged problems survive (they just lose the link).
  const { error: delErr } = await supabase
    .from("challenge_phases")
    .delete()
    .eq("challenge_id", id);
  if (delErr) return { ok: false, error: delErr.message };

  if (v.phases.length) {
    const rows = v.phases.map((p, i) => ({
      user_id: userId,
      challenge_id: id,
      name: p.name,
      duration_days: p.duration_days,
      sort_order: i,
      topics: p.topics,
    }));
    const { error: pErr } = await supabase.from("challenge_phases").insert(rows);
    if (pErr) return { ok: false, error: pErr.message };
  }

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteChallenge(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  const { error } = await supabase.from("challenges").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/challenges");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setChallengeStatus(
  id: string,
  status: ChallengeStatus,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  if (status === "Active") await demoteOtherActive(supabase, id);
  const { error } = await supabase
    .from("challenges")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
