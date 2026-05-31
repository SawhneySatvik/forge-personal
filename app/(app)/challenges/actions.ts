"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, isDayKey, todayInTz } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE } from "@/lib/queries";
import type { ChallengeStatus, DayKey } from "@/lib/types";

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

/** Resolve "today" in the user's stored timezone (falls back to the default). */
async function resolveToday(supabase: SupabaseClient): Promise<DayKey> {
  const { data } = await supabase.from("profiles").select("timezone").maybeSingle();
  return todayInTz((data?.timezone as string | undefined) ?? DEFAULT_TIMEZONE);
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

/** Mark (or clear) a single day's check-in for a challenge. */
export async function setChallengeDay(
  challengeId: string,
  date: string,
  done: boolean,
): Promise<ActionResult> {
  if (!isDayKey(date)) return { ok: false, error: "Invalid date." };
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("challenge_logs")
    .upsert(
      { user_id: userId, challenge_id: challengeId, date, done },
      { onConflict: "user_id,challenge_id,date" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  return { ok: true };
}

/** Make a challenge publicly viewable (or private again) at /share/c/[id]. */
export async function setChallengePublic(
  id: string,
  isPublic: boolean,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  const { error } = await supabase
    .from("challenges")
    .update({ is_public: isPublic })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${id}`);
  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Mark a checklist item (e.g. an SDE Sheet question) done or not. Marking done
 * also flips daily_logs.dsa_done and auto-checks-in the parent challenge for the
 * resolved day. Un-marking only flips the item — daily_logs stays "sticky true"
 * (other solves may own the day), keeping the DSA streak stable. Never writes a
 * dsa_problems row, so the DSA count heatmap can't double-count.
 */
export async function toggleChallengeItem(
  itemId: string,
  done: boolean,
  date?: string,
): Promise<ActionResult> {
  if (date && !isDayKey(date)) return { ok: false, error: "Invalid date." };
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: item, error: selErr } = await supabase
    .from("challenge_items")
    .select("challenge_id")
    .eq("id", itemId)
    .maybeSingle();
  if (selErr) return { ok: false, error: selErr.message };
  if (!item) return { ok: false, error: "Item not found." };
  const challengeId = item.challenge_id as string;

  const day = done ? (date ?? (await resolveToday(supabase))) : null;

  const { error: updErr } = await supabase
    .from("challenge_items")
    .update({ done, done_date: day })
    .eq("id", itemId)
    .eq("user_id", userId);
  if (updErr) return { ok: false, error: updErr.message };

  if (done && day) {
    const { error: dlErr } = await supabase
      .from("daily_logs")
      .upsert(
        { user_id: userId, date: day, dsa_done: true },
        { onConflict: "user_id,date" },
      );
    if (dlErr) return { ok: false, error: dlErr.message };

    const { error: clErr } = await supabase
      .from("challenge_logs")
      .upsert(
        { user_id: userId, challenge_id: challengeId, date: day, done: true },
        { onConflict: "user_id,challenge_id,date" },
      );
    if (clErr) return { ok: false, error: clErr.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dsa");
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  return { ok: true };
}

/** Mark an SDE-sheet question solved (+ optional note). Thin wrapper used by the
 * quick-log picker and the /dsa fast path so sheet progress stays canonical. */
export async function logSheetQuestion(
  itemId: string,
  opts: { note?: string | null; date?: string } = {},
): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  if (opts.note !== undefined) {
    const { error } = await supabase
      .from("challenge_items")
      .update({ note: opts.note })
      .eq("id", itemId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
  }
  return toggleChallengeItem(itemId, true, opts.date);
}

/** Toggle several checklist items at once (batch entry / "mark N solved"). */
export async function batchToggleChallengeItems(
  itemIds: string[],
  done: boolean,
): Promise<ActionResult> {
  const parsed = z.array(z.string().min(1)).min(1).safeParse(itemIds);
  if (!parsed.success) return { ok: false, error: "No items selected." };
  const ids = parsed.data;
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { data: items, error: selErr } = await supabase
    .from("challenge_items")
    .select("challenge_id")
    .in("id", ids);
  if (selErr) return { ok: false, error: selErr.message };

  const day = done ? await resolveToday(supabase) : null;

  const { error: updErr } = await supabase
    .from("challenge_items")
    .update({ done, done_date: day })
    .in("id", ids)
    .eq("user_id", userId);
  if (updErr) return { ok: false, error: updErr.message };

  const challengeIds = [
    ...new Set((items ?? []).map((r) => r.challenge_id as string)),
  ];

  if (done && day) {
    const { error: dlErr } = await supabase
      .from("daily_logs")
      .upsert(
        { user_id: userId, date: day, dsa_done: true },
        { onConflict: "user_id,date" },
      );
    if (dlErr) return { ok: false, error: dlErr.message };

    if (challengeIds.length) {
      const rows = challengeIds.map((cid) => ({
        user_id: userId,
        challenge_id: cid,
        date: day,
        done: true,
      }));
      const { error: clErr } = await supabase
        .from("challenge_logs")
        .upsert(rows, { onConflict: "user_id,challenge_id,date" });
      if (clErr) return { ok: false, error: clErr.message };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dsa");
  revalidatePath("/challenges");
  for (const cid of challengeIds) revalidatePath(`/challenges/${cid}`);
  return { ok: true };
}
