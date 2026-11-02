import { DONATION_MAX, DONATION_MIN, PLANS, isPlanId, type PlanId } from "@/lib/pricing";

export type Kind = PlanId | "donation";
export type Order = { kind: Kind; usd: number; label: string };

// Turns a client request into a server priced order. The client never sets plan prices.
export function parseOrder(body: { kind?: unknown; amount?: unknown }): Order | { error: string } {
  if (isPlanId(body.kind)) {
    const p = PLANS[body.kind];
    return { kind: body.kind, usd: p.usd, label: p.label };
  }
  if (body.kind === "donation") {
    const usd = Math.round(Number(body.amount) * 100) / 100;
    if (!Number.isFinite(usd) || usd < DONATION_MIN || usd > DONATION_MAX) {
      return { error: `Donations can be $${DONATION_MIN} to $${DONATION_MAX}.` };
    }
    return { kind: "donation", usd, label: "Donation to BibleWithYou" };
  }
  return { error: "Unknown item." };
}
