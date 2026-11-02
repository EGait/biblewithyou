import Link from "next/link";

export const metadata = { title: "Privacy | BibleWithYou" };

export default function Privacy() {
  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <h1>Privacy</h1>
      <p className="muted">Last updated November 2, 2026</p>
      <div className="stack">
        <h3>What we store</h3>
        <p>We do not store what you type or link it to your name. To prevent abuse, we keep a daily count of requests. It is tied to a scrambled form of your IP address, not the address itself, and it resets each day.</p>
        <h3>On your device</h3>
        <p>Your daily verse streak and badges are saved in your browser only. They are never sent to us. Clearing your browser data removes them.</p>
        <h3>Cookies</h3>
        <p>We use a small number of cookies only to make BibleWithYou work: one remembers if you have Plus, and one keeps you signed in if you use an account. We don&apos;t use ads or tracking cookies.</p>
        <h3>Accounts (optional)</h3>
        <p>You don&apos;t need an account to use BibleWithYou. If you sign in, we store your email address and a record of your Plus purchases with Supabase, our database provider, so Plus works on all your devices. Sign in links are sent to your email through our email provider. We don&apos;t save what you type into BibleWithYou to your account. You can delete your account any time from the Account page, which removes your email and purchase records. You can also email us at <a href="mailto:bible.wyou@gmail.com">bible.wyou@gmail.com</a> and we&apos;ll do it for you.</p>
        <h3>Payments</h3>
        <p>Card payments are handled by Stripe, which processes your card and email under its own privacy policy. We never see or store your card number. Solana Pay payments are recorded on the public Solana blockchain, which anyone can view, including your wallet address. If you buy Plus while signed in, we save a reference to the purchase (a Stripe subscription or Solana transaction ID) to your account.</p>
        <h3>AI processing</h3>
        <p>Your message is sent to Google&apos;s Gemini API to match it with a Bible story. During our free testing period, Google may use submitted content to improve its products and human reviewers may read it. Please avoid sharing names or identifying details.</p>
        <h3>Hosting</h3>
        <p>BibleWithYou runs on Vercel. Like any website host, Vercel sees IP addresses when you visit and keeps short term server logs to run and protect the site.</p>
        <h3>Children</h3>
        <p>BibleWithYou is not meant for children under 13, and we don&apos;t knowingly collect information from them.</p>
        <h3>Changes</h3>
        <p>If we change this policy, we&apos;ll update it here and change the date at the top.</p>
        <h3>Contact</h3>
        <p>Questions about your privacy or data? Email <a href="mailto:bible.wyou@gmail.com">bible.wyou@gmail.com</a>.</p>
        <h3>Not professional help</h3>
        <p>BibleWithYou shares scripture for encouragement. It is not counseling, medical, or legal advice. In the US, call or text 988 in a crisis, or 911 in an emergency.</p>
      </div>
    </main>
  );
}
