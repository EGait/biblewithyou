"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeIcon } from "@/components/DailyVerse";
import { BADGES, EMPTY, displayStreak, loadStreak, localDate, type StreakState } from "@/lib/streak";

export default function BadgesPage() {
  const [s, setS] = useState<StreakState>(EMPTY);
  useEffect(() => setS(loadStreak()), []);
  const today = localDate();

  return (
    <main className="wrap">
      <Link href="/" className="brand">BibleWithYou</Link>
      <div className="stack">
        <span className="eyebrow">Your journey</span>
        <h1>Badges</h1>
        <p className="muted">Open BibleWithYou each day to read the daily verse and grow your streak. Badges are yours to keep once earned.</p>
      </div>
      <div className="stats">
        <div className="stat"><span className="stat-num">{displayStreak(s, today)}</span><span className="small">Current streak</span></div>
        <div className="stat"><span className="stat-num">{s.best}</span><span className="small">Best streak</span></div>
        <div className="stat"><span className="stat-num">{s.total}</span><span className="small">Days visited</span></div>
      </div>
      <ul className="badges">
        {BADGES.map((b) => {
          const earned = s.badges.includes(b.id);
          return (
            <li key={b.id} className={`badge-item ${earned ? "" : "locked"}`}>
              <BadgeIcon size={40} locked={!earned} />
              <div>
                <strong>{b.name}</strong>
                <p className="small">{earned ? b.blurb : `${b.days} day streak`}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="small">Your streak is saved on this device. Signing in (coming soon) will keep it across devices.</p>
    </main>
  );
}
