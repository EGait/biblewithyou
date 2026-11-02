import { NextResponse, type NextRequest } from "next/server";
import { PLUS_COOKIE, cookieOptions, sign, type PlusToken } from "@/lib/entitlement";
import { PLANS, isPlanId } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Stripe redirects here after checkout. We confirm with Stripe directly, never trusting the URL alone.
export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const id = req.nextUrl.searchParams.get("session_id");
  if (!id) return NextResponse.redirect(`${origin}/plus`);

  const session = await stripe().checkout.sessions.retrieve(id);
  const kind = session.metadata?.kind;
  const paid = session.status === "complete" && session.payment_status === "paid";

  if (!paid) return NextResponse.redirect(`${origin}/${kind === "donation" ? "donate" : "plus"}?canceled=1`);
  if (kind === "donation") return NextResponse.redirect(`${origin}/donate?thanks=1`);
  if (!isPlanId(kind)) return NextResponse.redirect(`${origin}/plus`);

  const sub = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  // Monthly tokens are short and renew via /api/plus/status while the subscription is active.
  const days = kind === "monthly" ? 32 : PLANS.lifetime.days;
  const token: PlusToken = { plan: kind, exp: Date.now() + days * 864e5, src: "stripe", sub: sub ?? undefined };

  const res = NextResponse.redirect(`${origin}/plus?welcome=1`);
  res.cookies.set(PLUS_COOKIE, sign(token, "plus"), cookieOptions(token.exp));
  return res;
}
