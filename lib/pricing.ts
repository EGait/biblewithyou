// Prices and donation settings. Free version stays free; Plus is an optional upgrade.

export const PLANS = {
  monthly: { label: "Plus Monthly", usd: 0.99, days: 30 },
  lifetime: { label: "Plus Lifetime", usd: 4.99, days: 365 * 50 },
} as const;
export type PlanId = keyof typeof PLANS;

export const DONATION_PRESETS = [3, 5, 10, 25];
export const DONATION_MIN = 1;
export const DONATION_MAX = 500;

// Share of each donation that goes to the cause. The rest supports development.
// Set DONATION_CAUSE_PCT=50 for a 50/50 split or 20 for 20% cause / 80% dev.
export function donationConfig() {
  const pct = Math.min(100, Math.max(0, Number(process.env.DONATION_CAUSE_PCT ?? 50)));
  return {
    causePct: pct,
    devPct: 100 - pct,
    causeName: process.env.CAUSE_NAME || "a charity or local church (announced soon)",
  };
}

export function isPlanId(x: unknown): x is PlanId {
  return x === "monthly" || x === "lifetime";
}
