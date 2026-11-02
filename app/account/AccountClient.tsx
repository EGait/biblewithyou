"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = { plus: boolean; plan?: string; exp?: number; email: string | null; accounts: boolean };

export default function AccountClient() {
  const [status, setStatus] = useState<Status | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const refresh = () =>
    fetch("/api/plus/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ plus: false, email: null, accounts: false }));
  useEffect(() => { refresh(); }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (res?.ok) setSent(true);
    else setError(data.error || "Something went wrong. Please try again.");
  }

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    setBusy(false); setSent(false); setEmail("");
    refresh();
  }

  if (!status) return <p className="small">Loading…</p>;

  if (!status.accounts) {
    return <div className="card"><p>Accounts are coming soon.</p></div>;
  }

  if (status.email) {
    return (
      <div className="stack">
        <div className="card">
          <span className="small">Signed in as</span>
          <strong>{status.email}</strong>
        </div>
        <div className="card">
          <h3>Plus</h3>
          {status.plus ? (
            <p>
              You have Plus ({status.plan === "lifetime" ? "Lifetime" : "Monthly"}).
              {status.plan === "monthly" && status.exp ? ` Good through ${new Date(status.exp).toLocaleDateString()}.` : ""}
            </p>
          ) : (
            <>
              <p className="muted">You&apos;re on the free version.</p>
              <Link className="btn ghost" href="/plus">See Plus</Link>
            </>
          )}
        </div>
        <button className="btn ghost" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="card" role="status">
        <h3>Check your email</h3>
        <p>We sent a sign in link to <strong>{email}</strong>. Tap it to finish signing in. It may take a minute, and it might land in spam.</p>
        <button className="back" onClick={() => setSent(false)}>Use a different email</button>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={sendLink}>
      <label htmlFor="email">Email</label>
      <input id="email" className="input" type="email" autoComplete="email" inputMode="email" required
        value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign in link"}</button>
      {error && <p className="notice">{error}</p>}
      {status.plus && <p className="small">You have Plus in this browser. Sign in to keep it on all your devices.</p>}
      <p className="small">No password needed. We only use your email to sign you in.</p>
    </form>
  );
}
