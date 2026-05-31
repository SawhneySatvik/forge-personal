"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TIMEZONE_VALUES } from "@/lib/timezones";

export type ProfileState = { ok?: boolean; error?: string } | null;

function opt(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

const Schema = z.object({
  display_name: z.string().optional(),
  timezone: z.string().refine((v) => TIMEZONE_VALUES.has(v), "Unknown timezone."),
  github_username: z.string().optional(),
  leetcode_username: z.string().optional(),
  linkedin_url: z.string().optional(),
  x_handle: z.string().optional(),
});

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = Schema.safeParse({
    display_name: opt(formData.get("display_name")),
    timezone: String(formData.get("timezone") ?? ""),
    github_username: opt(formData.get("github_username")),
    leetcode_username: opt(formData.get("leetcode_username")),
    linkedin_url: opt(formData.get("linkedin_url")),
    x_handle: opt(formData.get("x_handle")),
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

  // Upsert doubles as the fallback if the signup trigger's profile row is missing.
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: v.display_name ?? null,
      timezone: v.timezone,
      github_username: v.github_username ?? null,
      leetcode_username: v.leetcode_username ?? null,
      linkedin_url: v.linkedin_url ?? null,
      x_handle: v.x_handle ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard"); // timezone affects "today"
  return { ok: true };
}
