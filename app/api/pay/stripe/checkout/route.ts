import { NextResponse } from "next/server";
import { parseOrder } from "@/lib/checkout";
import { donationConfig } from "@/lib/pricing";
import { stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "Card payments are not set up yet." }, { status: 503 });
  const order = parseOrder(await req.json().catch(() => ({})));
  if ("error" in order) return NextResponse.json(order, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const cents = Math.round(order.usd * 100);
  const monthly = order.kind === "monthly";
  const { causePct, causeName } = donationConfig();

  const session = await stripe().checkout.sessions.create({
    mode: monthly ? "subscription" : "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: cents,
          product_data: {
            name: order.label,
            description:
              order.kind === "donation"
                ? `${causePct}% goes to ${causeName}. Not tax deductible.`
                : "Unlimited stories and all Plus features. The free version stays free.",
          },
          ...(monthly ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata: { kind: order.kind, cause_pct: String(causePct) },
    success_url: `${origin}/api/pay/stripe/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${order.kind === "donation" ? "donate" : "plus"}?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
