"use client";

import { useState } from "react";
import PayButtons from "@/components/PayButtons";

type Props = { presets: number[]; min: number; max: number; solana: boolean; card: boolean };

export default function DonateClient({ presets, min, max, solana, card }: Props) {
  const [amount, setAmount] = useState(presets[1] ?? 5);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom) : amount;
  const valid = Number.isFinite(value) && value >= min && value <= max;

  return (
    <div className="stack">
      <div className="chips" role="radiogroup" aria-label="Donation amount">
        {presets.map((p) => (
          <button key={p} role="radio" aria-checked={!custom && amount === p}
            className={`chip ${!custom && amount === p ? "chip-on" : ""}`}
            onClick={() => { setAmount(p); setCustom(""); }}>
            ${p}
          </button>
        ))}
      </div>
      <label htmlFor="custom">Or enter an amount</label>
      <input id="custom" className="input" inputMode="decimal" placeholder={`$${min} to $${max}`}
        value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))} />
      {valid ? (
        <PayButtons key={value} kind="donation" amount={value} solana={solana} card={card} />
      ) : (
        <p className="small">Enter an amount between ${min} and ${max}.</p>
      )}
    </div>
  );
}
