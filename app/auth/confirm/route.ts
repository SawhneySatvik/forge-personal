import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-link callback for both Supabase auth flows:
 *  - PKCE: the default email templates redirect here with `?code=...`
 *    (no template editing needed).
 *  - OTP:  a token-hash template redirects here with `?token_hash=...&type=...`.
 * Either way we establish a session (via cookies) and redirect to `next`.
 * Password-reset links use next=/update-password (set in the reset request).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next");
  // Only allow same-origin relative paths — never an absolute/external URL —
  // to prevent the callback being used as an open redirect.
  const next =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.includes("\\")
      ? requestedNext
      : "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(
    new URL("/signin?error=link-invalid", request.url),
  );
}
