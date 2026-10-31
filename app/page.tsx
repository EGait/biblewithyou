"use client";

import { useState } from "react";
import Link from "next/link";

type Verse = { ref: string; text: string };
type Result =
  | { type: "story"; story: { title: string; ref: string; story: string; verses: Verse[] }; connection: string; safetyNote?: string; demo?: boolean }
  | { type: "crisis"; verse: Verse }
  | { type: "harm" }
  | { type: "crime" }
  | { type: "offtopic" }
  | { type: "limit" }
  | { type: "error"; message: string };

const EXAMPLES = [
  "My best friend went behind my back",
  "I'm anxious about money and bills",
  "I'm burned out and tired of everything",
  "I feel like I'm not good enough for my new job",
];

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F5F5B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 5c3-1.5 6.5-1.5 10 1 3.5-2.5 7-2.5 10-1v14c-3-1.5-6.5-1.5-10 1-3.5-2.5-7-2.5-10-1z" />
      <path d="M12 6v14" />
    </svg>
  );
}

function VerseCard({ v }: { v: Verse }) {
  return (
    <figure className="verse">
      <blockquote>{v.text}</blockquote>
      <figcaption>{v.ref} (WEB)</figcaption>
    </figure>
  );
}

function CrisisCard() {
  return (
    <div className="card">
      <h3>988 Suicide &amp; Crisis Lifeline (US)</h3>
      <a className="btn" href="tel:988">Call 988</a>
      <a className="btn ghost" href="sms:988">Text 988</a>
      <p className="small">If you or someone else is in immediate danger, call 911.</p>
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      setResult(await res.json());
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function share(v: Verse) {
    const msg = `"${v.text}" ${v.ref}`;
    if (navigator.share) await navigator.share({ text: msg }).catch(() => {});
    else await navigator.clipboard?.writeText(msg);
  }

  const reset = () => setResult(null);

  return (
    <main className="wrap">
      <Link href="/" className="brand" onClick={reset}><Logo /> BibleWithYou</Link>

      {!result && (
        <>
          <div className="stack">
            <h1>What are you carrying today?</h1>
            <p className="muted">Someone in the Bible has been where you are. Tell us what&apos;s going on.</p>
          </div>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
            <label htmlFor="feel">In your own words</label>
            <textarea id="feel" maxLength={600} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="My best friend went behind my back and I can't stop thinking about it..." />
            <button className="btn" disabled={loading}>{loading ? "Finding your story..." : "Find my story"}</button>
          </form>
          <div className="stack">
            <span className="small">Or try one</span>
            <div className="chips">
              {EXAMPLES.map((ex) => (
                <button key={ex} className="chip" disabled={loading} onClick={() => { setText(ex); submit(ex); }}>{ex}</button>
              ))}
            </div>
          </div>
          <p className="small">BibleWithYou shares scripture for encouragement. It isn&apos;t counseling, medical, or legal advice. In crisis, call or text 988.</p>
        </>
      )}

      {result && <button className="back" onClick={reset}>← Back</button>}

      {result?.type === "story" && (
        <>
          <span className="eyebrow">You&apos;re not the first</span>
          {result.safetyNote && <div className="notice">{result.safetyNote}</div>}
          <div className="card">
            <h2>{result.story.title}</h2>
            <span className="small">{result.story.ref}</span>
            <p>{result.story.story}</p>
          </div>
          <div className="stack">
            <h3>How this connects to you</h3>
            <p className="muted">{result.connection}</p>
          </div>
          <div className="stack">
            <h3>Verses to hold onto</h3>
            {result.story.verses.map((v) => <VerseCard key={v.ref} v={v} />)}
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => share(result.story.verses[0])}>Share verse</button>
            <button className="btn" onClick={reset}>Something else</button>
          </div>
          {result.demo && <p className="small">Demo mode: add a GEMINI_API_KEY for smarter matching.</p>}
        </>
      )}

      {result?.type === "crisis" && (
        <>
          <h1>You matter, and you don&apos;t have to carry this alone.</h1>
          <p className="muted">It sounds like you&apos;re going through something really heavy. Please reach out to someone right now. Talking to a real person can help.</p>
          <CrisisCard />
          <VerseCard v={result.verse} />
        </>
      )}

      {result?.type === "harm" && (
        <>
          <h2>Please pause before doing anything.</h2>
          <p className="muted">It sounds like you&apos;re carrying a lot of anger. We can&apos;t help with hurting anyone. If someone is in danger, call 911. If you need to talk to someone right now, call or text 988.</p>
          <CrisisCard />
        </>
      )}

      {result?.type === "crime" && (
        <>
          <h2>We can&apos;t help with that.</h2>
          <p className="muted">BibleWithYou can&apos;t help with anything illegal or with avoiding consequences. If you&apos;re feeling guilty about something you did, try telling us how you feel about it. Scripture has a lot to say about second chances.</p>
          <button className="btn ghost" onClick={reset}>Try again</button>
        </>
      )}

      {result?.type === "offtopic" && (
        <>
          <h2>Let&apos;s keep it personal.</h2>
          <p className="muted">BibleWithYou only matches what you&apos;re feeling or going through with stories from the Bible. Try telling us about your day, a worry, or something on your heart.</p>
          <button className="btn ghost" onClick={reset}>Try again</button>
        </>
      )}

      {result?.type === "limit" && (
        <>
          <h2>You&apos;ve hit today&apos;s limit.</h2>
          <p className="muted">Come back tomorrow for more. If you&apos;re in crisis, call or text 988 any time.</p>
        </>
      )}

      {result?.type === "error" && (
        <>
          <p className="notice">{result.message}</p>
          <button className="btn ghost" onClick={reset}>Try again</button>
        </>
      )}

      <footer className="small"><Link href="/privacy">Privacy</Link> · Scripture from the World English Bible (public domain)</footer>
    </main>
  );
}
