"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "bwy_ai_notice_v1";

// Shown once on first visit: how AI is used and that scripture never comes from it.
// If storage is blocked it just shows each visit, which is fine.
export default function AiNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { setShow(localStorage.getItem(KEY) !== "1"); } catch { setShow(true); }
  }, []);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
  }

  if (!show) return null;

  return (
    <div className="card" role="region" aria-label="How BibleWithYou works">
      <h3>Before you start</h3>
      <p>BibleWithYou uses AI (Google Gemini) to pick a Bible story for what you share and to write a short note on how it connects to you.</p>
      <p>The story and verses always come from our own library, with verses taken word for word from the World English Bible. The AI never writes scripture.</p>
      <p className="small">What you type is sent to Google to find your story. Please leave out names and private details. <Link href="/privacy">Privacy</Link></p>
      <button className="btn" onClick={dismiss}>Got it</button>
    </div>
  );
}
