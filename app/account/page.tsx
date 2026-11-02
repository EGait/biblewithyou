import Link from "next/link";
import AccountClient from "./AccountClient";

export const metadata = { title: "Account | BibleWithYou" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <div className="stack">
        <span className="eyebrow">Optional</span>
        <h1>Your account</h1>
        <p className="muted">You never need an account to use BibleWithYou. Signing in keeps Plus with you on every device.</p>
      </div>
      {sp.error === "link" && <p className="notice">That sign in link didn&apos;t work or has expired. Please send a new one.</p>}
      <AccountClient />
    </main>
  );
}
