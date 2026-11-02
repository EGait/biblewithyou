import Link from "next/link";
import { PLANS } from "@/lib/pricing";
import { solanaEnabled, stripeEnabled } from "@/lib/stripe";
import ComingSoon from "@/components/ComingSoon";
import { PLUS_LIVE } from "@/lib/features";
import PlusClient from "./PlusClient";

export const metadata = { title: "Plus | BibleWithYou" };
export const dynamic = "force-dynamic";

export default async function PlusPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  if (!PLUS_LIVE) return <ComingSoon title="BibleWithYou Plus" />;
  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <div className="stack">
        <span className="eyebrow">Optional upgrade</span>
        <h1>BibleWithYou Plus</h1>
        <p className="muted">The free version stays free. Plus is for anyone who wants more and wants to help keep this going.</p>
      </div>
      {sp.welcome && <p className="notice">Welcome to Plus. Thank you for supporting BibleWithYou!</p>}
      {sp.canceled && <p className="notice">Checkout was canceled. Nothing was charged.</p>}
      <div className="card">
        <h3>What you get</h3>
        <ul className="list">
          <li>Unlimited stories every day</li>
          <li>Saved journal of your stories (coming soon)</li>
          <li>Shareable verse cards (coming soon)</li>
          <li>Every future Plus feature</li>
        </ul>
      </div>
      <PlusClient
        monthly={PLANS.monthly.usd}
        lifetime={PLANS.lifetime.usd}
        solana={solanaEnabled()}
        card={stripeEnabled()}
      />
      <p className="small">Monthly by card renews automatically and can be canceled anytime. Monthly with Solana Pay is a 30 day pass that does not auto renew. Plus is saved in this browser, and in your account if you sign in.</p>
    </main>
  );
}
