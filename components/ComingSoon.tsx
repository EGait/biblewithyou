import Link from "next/link";

// Shown on Plus and Donate while PLUS_LIVE is off.
export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <div className="stack">
        <h1>{title}</h1>
        <p className="muted">This is coming soon. Everything in BibleWithYou is free to use in the meantime.</p>
        <Link className="btn ghost" href="/">Back to BibleWithYou</Link>
      </div>
    </main>
  );
}
