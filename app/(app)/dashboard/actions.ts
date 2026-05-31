"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDayKey } from "@/lib/date";
import { HABITS_BY_KEY } from "@/lib/habits";
import { createClient } from "@/lib/supabase/server";
import type { GymStatus, HabitKey } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Set a single habit's value for a day on the wide daily_logs row (the single
 * source of truth for streaks). `value` is a boolean for the binary habits and
 * a GymStatus | null for gym.
 */
export async function setHabit(
  habitKey: HabitKey,
  date: string,
  value: boolean | GymStatus | null,
): Promise<ActionResult> {
  if (!isDayKey(date)) return { ok: false, error: "Invalid date." };
  const def = HABITS_BY_KEY[habitKey];
  if (!def) return { ok: false, error: "Unknown habit." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const payload: Record<string, unknown> = { user_id: user.id, date };
  payload[def.column] = value;

  const { error } = await supabase
    .from("daily_logs")
    .upsert(payload, { onConflict: "user_id,date" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(def.href);
  return { ok: true };
}

const LogSchema = z.object({
  name: z.string().min(1, "Enter a problem name."),
  topic: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  solved: z.boolean(),
  notes: z.string().optional(),
  date: z.string().refine(isDayKey, "Invalid date."),
  problem_url: z.string().optional(),
  challenge_id: z.string().optional(),
});

export type LogState = { ok?: boolean; error?: string; id?: string } | null;

function opt(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

export async function logDsaProblem(
  _prev: LogState,
  formData: FormData,
): Promise<LogState> {
  const parsed = LogSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    topic: opt(formData.get("topic")),
    difficulty: opt(formData.get("difficulty")),
    solved: formData.get("solved") === "on" || formData.get("solved") === "true",
    notes: opt(formData.get("notes")),
    date: String(formData.get("date") ?? ""),
    problem_url: opt(formData.get("problem_url")),
    challenge_id: opt(formData.get("challenge_id")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: inserted, error } = await supabase
    .from("dsa_problems")
    .insert({
      user_id: user.id,
      name: v.name,
      topic: v.topic ?? null,
      difficulty: v.difficulty ?? null,
      solved: v.solved,
      notes: v.notes ?? null,
      date: v.date,
      problem_url: v.problem_url ?? null,
      challenge_id: v.challenge_id ?? null,
      source_label: "TakeUForward SDE Sheet",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Logging a problem marks DSA done for the day. daily_logs is the streak
  // source of truth, so a failure here must NOT be silently swallowed.
  const { error: logError } = await supabase
    .from("daily_logs")
    .upsert(
      { user_id: user.id, date: v.date, dsa_done: true },
      { onConflict: "user_id,date" },
    );
  if (logError) return { error: logError.message };

  revalidatePath("/dashboard");
  revalidatePath("/dsa");
  return { ok: true, id: inserted.id as string };
}
