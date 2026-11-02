"use client";

import { useEffect, useState } from "react";
import PayButtons from "@/components/PayButtons";

type Props = { monthly: number; lifetime: number; solana: boolean; card: boolean };

export default function PlusClient({ monthly, lifetime, solana, card }: Props) {
  const [plan, setPlan] = useState<"lifetime" | "monthly">("lifetime");
  const [active, setActive] = useState<{ plus: boolean; plan?: string } | null>(null);

  const refresh = () => fetch("/api/plus/status").then((r) => r.json()).then(setActive).catch(() => {});
  useEffect(() => { refresh(); }, []);

  if (active?.plus) {
    return (
      <div className="card">
        <h3>You have Plus ({active.plan === "lifetime" ? "Lifetime" : "Monthly"})</h3>
        <p className="muted">Thank you for supporting BibleWithYou.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="plans" role="radiogroup" aria-label="Choose a plan">
        <button role="radio" aria-checked={plan === "lifetime"} className={`plan ${plan === "lifetime" ? "on" : ""}`} onClick={() => setPlan("lifetime")}>
          <span className="plan-name">Lifetime</span>
          <span className="plan-price">${lifetime.toFixed(2)}</span>
          <span className="small">One time. Yours forever.</span>
        </button>
        <button role="radio" aria-checked={plan === "monthly"} className={`plan ${plan === "monthly" ? "on" : ""}`} onClick={() => setPlan("monthly")}>
          <span className="plan-name">Monthly</span>
          <span className="plan-price">${monthly.toFixed(2)}</span>
          <span className="small">Per month.</span>
        </button>
      </div>
      <PayButtons key={plan} kind={plan} solana={solana} card={card} onPaid={refresh} />
    </div>
  );
}
