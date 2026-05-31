"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDayKey } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type AddState = { ok?: boolean; error?: string; id?: string } | null;

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

const AddSchema = z.object({ name: z.string().min(1, "Enter a topic name.") });

export async function addSystemDesignTopic(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  const parsed = AddSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { supabase, userId } = await getAuth();
  if (!userId) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("system_design_topics")
    .insert({ user_id: userId, name: parsed.data.name })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/system-design");
  return { ok: true, id: data.id as string };
}

/** Mark a topic covered/uncovered. Covering also flips today's daily_logs flag. */
export async function setTopicCovered(
  id: string,
  covered: boolean,
  today: string,
): Promise<ActionResult> {
  if (!isDayKey(today)) return { ok: false, error: "Invalid date." };
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("system_design_topics")
    .update({
      covered,
      covered_at: covered ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Mirror the DSA pattern: covering a topic counts as "studied today".
  // Do NOT clear the flag on un-cover (other topics may be covered the same day).
  if (covered) {
    const { error: logError } = await supabase
      .from("daily_logs")
      .upsert(
        { user_id: userId, date: today, system_design_done: true },
        { onConflict: "user_id,date" },
      );
    if (logError) return { ok: false, error: logError.message };
  }

  revalidatePath("/system-design");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTopic(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuth();
  if (!userId) return { ok: false, error: "Not authenticated." };
  const { error } = await supabase
    .from("system_design_topics")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/system-design");
  return { ok: true };
}
