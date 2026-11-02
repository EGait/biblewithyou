import { NextResponse, type NextRequest } from "next/server";
import { PLUS_COOKIE, cookieOptions, readPlus, readPlusAllowExpired, sign } from "@/lib/entitlement";
import { stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

// Tells the UI whether this browser has Plus. Renews Stripe monthly tokens near expiry.
export async function GET(req: NextRequest) {
  const raw = req.cookies.get(PLUS_COOKIE)?.value;
  let token;
  try {
    token = readPlus(raw);
  } catch {
    return NextResponse.json({ plus: false }); // UNLOCK_SECRET not set yet
  }

  const stale = token ?? readPlusAllowExpired(raw);
  const nearEnd = stale && stale.exp - Date.now() < 3 * 864e5;
  if (stale?.src === "stripe" && stale.plan === "monthly" && stale.sub && nearEnd && stripeEnabled()) {
    try {
      const sub = await stripe().subscriptions.retrieve(stale.sub);
      if (sub.status === "active" || sub.status === "trialing") {
        token = { ...stale, exp: Date.now() + 32 * 864e5 };
        const res = NextResponse.json({ plus: true, plan: token.plan, exp: token.exp });
        res.cookies.set(PLUS_COOKIE, sign(token, "plus"), cookieOptions(token.exp));
        return res;
      }
      token = null;
    } catch (e) {
      console.error("stripe renew", e);
    }
  }

  return NextResponse.json(token ? { plus: true, plan: token.plan, exp: token.exp } : { plus: false });
}
