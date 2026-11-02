import { NextResponse, type NextRequest } from "next/server";
import { checkLimit } from "@/lib/rateLimit";
import { accountsEnabled, sessionClient } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails a one tap sign in link. No passwords.
export async function POST(req: NextRequest) {
  if (!accountsEnabled()) return NextResponse.json({ error: "Accounts are coming soon." }, { status: 503 });

  const { email } = await req.json().catch(() => ({}));
  const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL.test(clean) || clean.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!(await checkLimit(`login:${ip}`, 5)).ok) {
    return NextResponse.json({ error: "Too many tries today. Please try again tomorrow." }, { status: 429 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/account`, shouldCreateUser: true },
  });
  if (error) {
    console.error("login", error.message);
    const slow = error.status === 429 || /rate limit/i.test(error.message);
    return NextResponse.json(
      { error: slow ? "Too many emails sent. Please wait a few minutes and try again." : "We couldn't send the email. Please try again." },
      { status: slow ? 429 : 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
