import { NextResponse } from "next/server";
import { PLUS_COOKIE, cookieOptions, sign, verify, type PlusToken } from "@/lib/entitlement";
import { PLANS, isPlanId } from "@/lib/pricing";
import { findPayment } from "@/lib/solanaPay";

export const runtime = "nodejs";

type Intent = { ref: string; kind: string; amount: string; ts: number };

export async function POST(req: Request) {
  const { intent } = await req.json().catch(() => ({}));
  const i = verify<Intent>(intent, "intent");
  if (!i || typeof i.ts !== "number" || typeof i.ref !== "string" || typeof i.amount !== "string") return NextResponse.json({ status: "invalid" }, { status: 400 });
  if (Date.now() - i.ts > 60 * 60 * 1000) return NextResponse.json({ status: "expired" });

  let signature: string | null = null;
  try {
    signature = await findPayment(i.ref, i.amount);
  } catch (e) {
    console.error("solana verify", e);
    return NextResponse.json({ status: "pending" });
  }
  if (!signature) return NextResponse.json({ status: "pending" });

  const res = NextResponse.json({ status: "paid", kind: i.kind, signature });
  if (isPlanId(i.kind)) {
    const token: PlusToken = { plan: i.kind, exp: Date.now() + PLANS[i.kind].days * 864e5, src: "solana", ref: i.ref };
    res.cookies.set(PLUS_COOKIE, sign(token, "plus"), cookieOptions(token.exp));
  }
  return res;
}
