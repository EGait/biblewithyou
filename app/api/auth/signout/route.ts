import { NextResponse } from "next/server";
import { PLUS_COOKIE } from "@/lib/entitlement";
import { accountsEnabled, sessionClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Signs out and removes Plus from this browser (it comes back on the next sign in).
export async function POST() {
  if (accountsEnabled()) await (await sessionClient()).auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PLUS_COOKIE);
  return res;
}
