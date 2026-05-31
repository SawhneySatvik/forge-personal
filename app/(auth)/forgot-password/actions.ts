"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string; sent?: boolean } | null;

function resolveOrigin(host: string | null): string {
  // Prefer a trusted configured origin; fall back to the request host in dev.
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = host ?? "localhost:3000";
  const protocol =
    h.startsWith("localhost") || h.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${h}`;
}

export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const hdrs = await headers();
  const origin = resolveOrigin(hdrs.get("host"));

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  if (error) return { error: error.message };
  // Always report success-ish to avoid leaking which emails exist.
  return { sent: true };
}
