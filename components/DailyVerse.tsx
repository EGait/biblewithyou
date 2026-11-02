"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkIn, displayStreak, loadStreak, localDate, nextBadge, saveStreak, type Badge, type StreakState } from "@/lib/streak";

type Verse = { ref: string; text: string };
type Daily = { date: string; verse: Verse; story: { title: string; ref: string; story: string; verses: Verse[] } };

export default function DailyVerse() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [unlocked, setUnlocked] = useState<Badge[]>([]);
  const [open, setOpen] = useState(false);
  const today = localDate();

  useEffect(() => {
    fetch(`/api/daily?date=${today}`).then((r) => r.json()).then(setDaily).catch(() => {});
    const { state, unlocked } = checkIn(loadStreak(), today);
    saveStreak(state);
    setStreak(state);
    setUnlocked(unlocked);
  }, [today]);

  if (!daily) return null;
  const days = streak ? displayStreak(streak, today) : 0;
  const next = streak ? nextBadge(streak) : null;

  return (
    <section className="stack" aria-labelledby="daily-h">
      {unlocked.length > 0 && (
        <div className="badge-toast" role="status">
          <BadgeIcon />
          <div>
            <strong>Badge unlocked: {unlocked[unlocked.length - 1].name}</strong>
            <p className="small">{unlocked[unlocked.length - 1].blurb}</p>
          </div>
        </div>
      )}
      <div className="row-between">
        <h2 id="daily-h" className="h3">Today&apos;s verse</h2>
        <Link href="/badges" className="streak" aria-label={`${days} day streak. See badges`}>
          <FlameIcon /> {days} day{days === 1 ? "" : "s"}
        </Link>
      </div>
      <figure className="verse">
        <blockquote>{daily.verse.text}</blockquote>
        <figcaption>{daily.verse.ref} (WEB)</figcaption>
      </figure>
      <button className="back" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Hide the story" : `Read the story: ${daily.story.title}`}
      </button>
      {open && (
        <div className="card">
          <h3>{daily.story.title}</h3>
          <span className="small">{daily.story.ref}</span>
          <p>{daily.story.story}</p>
        </div>
      )}
      {next && streak && (
        <p className="small">
          {next.days - days === 1 ? "1 more day" : `${next.days - days} more days`} in a row to unlock <strong>{next.name}</strong>.
        </p>
      )}
    </section>
  );
}

export function BadgeIcon({ size = 28, locked = false }: { size?: number; locked?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={locked ? "#9AA4B0" : "#1F5F5B"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" fill={locked ? "none" : "#E6EFEE"} />
      <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 3 2.5 3 4" />
    </svg>
  );
}
