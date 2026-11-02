import { NextResponse, type NextRequest } from "next/server";
import { PLUS_COOKIE, cookieOptions, readPlus, readPlusAllowExpired, sign, type PlusToken } from "@/lib/entitlement";
import { extendPurchase, latestPurchase, linkPurchase } from "@/lib/purchases";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { accountsEnabled, currentUser } from "@/lib/supabase";

export const runtime = "nodejs";

// Tells the UI whether this browser has Plus and who is signed in.
// If signed in: saves this browser's purchase to the account, and restores Plus
// from the account on a new device. Renews Stripe monthly tokens near expiry.
export async function GET(req: NextRequest) {
  const accounts = accountsEnabled();
  const user = await currentUser();
  const email = user?.email ?? null;
  const raw = req.cookies.get(PLUS_COOKIE)?.value;

  let token: PlusToken | null;
  let stale: PlusToken | null;
  try {
    token = readPlus(raw);
    stale = token ?? readPlusAllowExpired(raw);
  } catch {
    return NextResponse.json({ plus: false, email, accounts }); // UNLOCK_SECRET not set yet
  }

  let setCookie = false;
  if (user) {
    try {
      if (stale) await linkPurchase(user.id, stale);
      if (!token) {
        const saved = await latestPurchase(user.id);
        if (saved) {
          stale = saved;
          if (saved.exp > Date.now()) {
            token = saved;
            setCookie = true;
          }
        }
      }
    } catch (e) {
      console.error("account purchases", e);
    }
  }

  const nearEnd = stale && stale.exp - Date.now() < 3 * 864e5;
  if (stale?.src === "stripe" && stale.plan === "monthly" && stale.sub && nearEnd && stripeEnabled()) {
    try {
      const sub = await stripe().subscriptions.retrieve(stale.sub);
      if (sub.status === "active" || sub.status === "trialing") {
        token = { ...stale, exp: Date.now() + 32 * 864e5 };
        setCookie = true;
        if (user) await extendPurchase(token);
      } else {
        token = null;
      }
    } catch (e) {
      console.error("stripe renew", e);
    }
  }

  const res = NextResponse.json(
    token ? { plus: true, plan: token.plan, exp: token.exp, email, accounts } : { plus: false, email, accounts },
  );
  if (token && setCookie) res.cookies.set(PLUS_COOKIE, sign(token, "plus"), cookieOptions(token.exp));
  return res;
}
