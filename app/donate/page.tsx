import Link from "next/link";
import { DONATION_MAX, DONATION_MIN, DONATION_PRESETS, donationConfig } from "@/lib/pricing";
import { solanaEnabled, stripeEnabled } from "@/lib/stripe";
import DonateClient from "./DonateClient";

export const metadata = { title: "Donate | BibleWithYou" };
export const dynamic = "force-dynamic";

export default async function DonatePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { causePct, devPct, causeName } = donationConfig();
  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <div className="stack">
        <span className="eyebrow">Give</span>
        <h1>Support BibleWithYou</h1>
        <p className="muted">Every gift does double good. Part goes to a good cause, and part keeps this app free and growing.</p>
      </div>
      {sp.thanks && <p className="notice">Thank you for your gift! It means a lot.</p>}
      {sp.canceled && <p className="notice">Checkout was canceled. Nothing was charged.</p>}
      <div className="card">
        <h3>Where your gift goes</h3>
        <div className="split" aria-hidden="true">
          <span style={{ width: `${causePct}%` }} className="split-cause" />
          <span style={{ width: `${devPct}%` }} className="split-dev" />
        </div>
        <p><strong>{causePct}%</strong> to {causeName}</p>
        <p><strong>{devPct}%</strong> to building and running BibleWithYou</p>
        <p className="small">We give the cause portion every quarter and post receipts on this page. Donations to BibleWithYou are not tax deductible.</p>
      </div>
      <DonateClient presets={DONATION_PRESETS} min={DONATION_MIN} max={DONATION_MAX} solana={solanaEnabled()} card={stripeEnabled()} />
      <div className="stack">
        <h3>Giving receipts</h3>
        <p className="small">[First receipt will be posted here after the first quarter.]</p>
      </div>
    </main>
  );
}
