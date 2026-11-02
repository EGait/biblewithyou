"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  kind: "monthly" | "lifetime" | "donation";
  amount?: number;
  solana: boolean;
  card: boolean;
  onPaid?: () => void;
};

type SolState = { url: string; qr: string; intent: string; amount: string } | null;

export default function PayButtons({ kind, amount, solana, card, onPaid }: Props) {
  const [busy, setBusy] = useState<"card" | "solana" | null>(null);
  const [error, setError] = useState("");
  const [sol, setSol] = useState<SolState>(null);
  const [status, setStatus] = useState<"" | "waiting" | "paid" | "expired">("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function payCard() {
    setBusy("card"); setError("");
    const res = await fetch("/api/pay/stripe/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, amount }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setError(data.error || "Something went wrong."); setBusy(null); }
  }

  async function paySolana() {
    setBusy("solana"); setError("");
    const res = await fetch("/api/pay/solana/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, amount }),
    });
    const data = await res.json();
    setBusy(null);
    if (!data.url) { setError(data.error || "Something went wrong."); return; }
    setSol(data); setStatus("waiting");

    const started = Date.now();
    timer.current = setInterval(async () => {
      if (Date.now() - started > 10 * 60 * 1000) {
        clearInterval(timer.current!); setStatus("expired"); return;
      }
      const v = await fetch("/api/pay/solana/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: data.intent }),
      }).then((r) => r.json()).catch(() => ({ status: "pending" }));
      if (v.status === "paid") { clearInterval(timer.current!); setStatus("paid"); onPaid?.(); }
      if (v.status === "expired" || v.status === "invalid") { clearInterval(timer.current!); setStatus("expired"); }
    }, 3000);
  }

  function cancel() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setSol(null);
    setStatus("");
  }

  if (sol && status !== "") {
    return (
      <div className="card" aria-live="polite">
        {status === "waiting" && (
          <>
            <h3>Pay {sol.amount} USDC</h3>
            <a className="btn" href={sol.url}>Open wallet</a>
            <img src={sol.qr} alt="Solana Pay QR code" width={220} height={220} style={{ alignSelf: "center", borderRadius: 12 }} />
            <p className="small">On Seeker, tap Open wallet. On a computer, scan the code with your phone wallet. This page updates when the payment lands.</p>
            <p className="waiting" role="status"><span className="spinner" aria-hidden="true" /> Waiting for payment…</p>
            <button className="btn ghost" onClick={cancel}>Cancel</button>
          </>
        )}
        {status === "paid" && <h3>Payment received. Thank you!</h3>}
        {status === "expired" && (
          <>
            <p>This payment link expired. If you already paid, contact us with your transaction.</p>
            <button className="btn ghost" onClick={cancel}>Start over</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      {solana && (
        <button className="btn" onClick={paySolana} disabled={busy !== null}>
          {busy === "solana" ? "Preparing..." : "Pay with Solana Pay (USDC)"}
        </button>
      )}
      {card && (
        <button className="btn ghost" onClick={payCard} disabled={busy !== null}>
          {busy === "card" ? "Opening checkout..." : "Pay with card"}
        </button>
      )}
      {!solana && !card && <p className="small">Payments are coming soon.</p>}
      {error && <p className="notice">{error}</p>}
    </div>
  );
}
