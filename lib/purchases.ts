import { purchaseRef, type PlusToken } from "@/lib/entitlement";
import { isPlanId } from "@/lib/pricing";
import { adminClient } from "@/lib/supabase";

// Plus purchases saved to an account, so Plus follows the person to any device.
// The signed cookie stays as a fast cache; this table is the lasting record.

type Row = {
  plan: string;
  source: string;
  source_ref: string;
  stripe_subscription_id: string | null;
  expires_at: string;
};

// Saves a purchase to this account. A purchase already saved to another account is left alone.
export async function linkPurchase(userId: string, t: PlusToken, solanaSignature?: string): Promise<void> {
  const ref = purchaseRef(t);
  if (!ref) return;
  const { error } = await adminClient()
    .from("entitlements")
    .upsert(
      {
        user_id: userId,
        plan: t.plan,
        source: t.src,
        source_ref: ref,
        solana_signature: solanaSignature ?? null,
        stripe_subscription_id: t.sub ?? null,
        expires_at: new Date(t.exp).toISOString(),
      },
      { onConflict: "source_ref", ignoreDuplicates: true },
    );
  if (error) console.error("linkPurchase", error.message);
}

// The account's purchase that runs the longest, expired or not (expired Stripe monthly can still renew).
export async function latestPurchase(userId: string): Promise<PlusToken | null> {
  const { data, error } = await adminClient()
    .from("entitlements")
    .select("plan, source, source_ref, stripe_subscription_id, expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<Row>();
  if (error) {
    console.error("latestPurchase", error.message);
    return null;
  }
  if (!data || !isPlanId(data.plan) || (data.source !== "solana" && data.source !== "stripe")) return null;
  return {
    plan: data.plan,
    exp: new Date(data.expires_at).getTime(),
    src: data.source,
    sub: data.stripe_subscription_id ?? undefined,
    ...(data.source === "solana" ? { ref: data.source_ref } : { sid: data.source_ref }),
  };
}

export async function extendPurchase(t: PlusToken): Promise<void> {
  const ref = purchaseRef(t);
  if (!ref) return;
  const { error } = await adminClient()
    .from("entitlements")
    .update({ expires_at: new Date(t.exp).toISOString() })
    .eq("source_ref", ref);
  if (error) console.error("extendPurchase", error.message);
}
