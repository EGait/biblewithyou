import Stripe from "stripe";
import { PLUS_LIVE } from "@/lib/features";

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

export const stripeEnabled = () => PLUS_LIVE && Boolean(process.env.STRIPE_SECRET_KEY);
export const solanaEnabled = () => PLUS_LIVE && Boolean(process.env.SOLANA_MERCHANT_WALLET);
