// Run: npx tsx scripts/test-streak.ts
import { EMPTY, checkIn, displayStreak } from "../lib/streak";

let s = EMPTY;
let fail = 0;
const expect = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: got ${JSON.stringify(got)}${ok ? "" : ` want ${JSON.stringify(want)}`}`);
};

let r = checkIn(s, "2026-11-01"); s = r.state;
expect("first visit streak", s.current, 1);
expect("first badge", r.unlocked.map((b) => b.id), ["day-1"]);
r = checkIn(s, "2026-11-01"); expect("same day no change", r.state, s);
for (const d of ["2026-11-02", "2026-11-03"]) { r = checkIn(s, d); s = r.state; }
expect("3 day streak", s.current, 3);
expect("3 day badge", r.unlocked.map((b) => b.id), ["day-3"]);
r = checkIn(s, "2026-11-06"); s = r.state;
expect("missed days resets", s.current, 1);
expect("best kept", s.best, 3);
expect("badges kept", s.badges, ["day-1", "day-3"]);
expect("display after gap", displayStreak(s, "2026-11-09"), 0);
r = checkIn(s, "2026-11-01"); expect("clock backward ignored", r.state, s);
let t = EMPTY;
for (let i = 0; i < 30; i++) t = checkIn(t, new Date(Date.UTC(2026, 11, 30 + i)).toISOString().slice(0, 10)).state;
expect("30 days across new year", t.current, 30);
expect("month badge", t.badges.includes("day-30"), true);

console.log(fail ? `\n${fail} failed` : "\nAll passed");
process.exit(fail ? 1 : 0);
