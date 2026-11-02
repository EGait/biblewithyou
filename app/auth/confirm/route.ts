import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { accountsEnabled, safeNext, sessionClient } from "@/lib/supabase";

export const runtime = "nodejs";

// The link in the sign in email lands here. token_hash works even when the email app
// opens the link in a different browser; code is the fallback for Supabase's default template.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const next = safeNext(sp.get("next"));
  if (!accountsEnabled()) return NextResponse.redirect(new URL("/account", req.url));

  const supabase = await sessionClient();
  const tokenHash = sp.get("token_hash");
  const type = sp.get("type") as EmailOtpType | null;
  const code = sp.get("code");

  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  return NextResponse.redirect(new URL(ok ? next : "/account?error=link", req.url));
}
