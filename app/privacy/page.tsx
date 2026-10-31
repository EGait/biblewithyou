import Link from "next/link";

export const metadata = { title: "Privacy | BibleWithYou" };

export default function Privacy() {
  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <h1>Privacy</h1>
      <p className="muted">[DRAFT. Have this reviewed before launch.]</p>
      <div className="stack">
        <h3>What we store</h3>
        <p>We do not store what you type or link it to your name. We keep a short daily request count to prevent abuse.</p>
        <h3>AI processing</h3>
        <p>Your message is sent to Google&apos;s Gemini API to match it with a Bible story. During our free testing period, Google may use submitted content to improve its products and human reviewers may read it. Please avoid sharing names or identifying details.</p>
        <h3>Not professional help</h3>
        <p>BibleWithYou shares scripture for encouragement. It is not counseling, medical, or legal advice. In the US, call or text 988 in a crisis, or 911 in an emergency.</p>
      </div>
    </main>
  );
}
