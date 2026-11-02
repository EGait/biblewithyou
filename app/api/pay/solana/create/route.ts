import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { parseOrder } from "@/lib/checkout";
import { sign } from "@/lib/entitlement";
import { donationConfig } from "@/lib/pricing";
import { newReference, paymentUrl } from "@/lib/solanaPay";
import { solanaEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!solanaEnabled()) return NextResponse.json({ error: "Solana Pay is not set up yet." }, { status: 503 });
  const order = parseOrder(await req.json().catch(() => ({})));
  if ("error" in order) return NextResponse.json(order, { status: 400 });

  const reference = newReference();
  const amount = order.usd.toFixed(2);
  const message =
    order.kind === "donation"
      ? `Thank you! ${donationConfig().causePct}% goes to ${donationConfig().causeName}.`
      : `${order.label}. Thank you for supporting BibleWithYou.`;
  const url = paymentUrl({ amount, reference, label: "BibleWithYou", message });
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 280 });

  // Signed so the verify step knows what was owed without a database.
  const intent = sign({ ref: reference, kind: order.kind, amount, ts: Date.now() }, "intent");
  return NextResponse.json({ url, qr, intent, amount });
}
