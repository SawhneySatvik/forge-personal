import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Reject cross-site POSTs (logout CSRF): the Origin, when present, must match
  // the request host.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 forces the redirect to be followed as a GET.
  return NextResponse.redirect(new URL("/signin", request.url), { status: 303 });
}
