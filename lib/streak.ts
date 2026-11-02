// Daily streaks and badges. Pure logic, safe for the browser.
// Stored in localStorage until email login exists, then move to the database.

export type Badge = { id: string; days: number; name: string; blurb: string };

// Earned by best streak, so a badge is kept forever once unlocked.
export const BADGES: Badge[] = [
  { id: "day-1", days: 1, name: "First Step", blurb: "You showed up. That's where every journey starts." },
  { id: "day-3", days: 3, name: "Three Days", blurb: "Three days in a row. Good things happen on the third day." },
  { id: "day-7", days: 7, name: "One Week", blurb: "A full week, like the week of creation." },
  { id: "day-14", days: 14, name: "Two Weeks", blurb: "Fourteen days. This is becoming a habit." },
  { id: "day-30", days: 30, name: "One Month", blurb: "A whole month of showing up." },
  { id: "day-40", days: 40, name: "Forty Days", blurb: "Forty days, like Jesus in the wilderness." },
  { id: "day-100", days: 100, name: "100 Days", blurb: "One hundred days. Faithful in the small things." },
  { id: "day-365", days: 365, name: "One Year", blurb: "A full year with BibleWithYou." },
];

export type StreakState = {
  current: number;
  best: number;
  total: number;
  last: string | null; // YYYY-MM-DD local date of last check in
  badges: string[];
};

export const EMPTY: StreakState = { current: 0, best: 0, total: 0, last: null, badges: [] };
const KEY = "bwy_streak_v1";

export function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 864e5);
}

// Records today's visit. Returns the new state and any badges just unlocked.
export function checkIn(prev: StreakState, today: string): { state: StreakState; unlocked: Badge[] } {
  if (prev.last === today) return { state: prev, unlocked: [] };
  if (prev.last && dayNumber(today) < dayNumber(prev.last)) return { state: prev, unlocked: [] }; // clock went backward

  const gap = prev.last ? dayNumber(today) - dayNumber(prev.last) : 0;
  const current = gap === 1 ? prev.current + 1 : 1;
  const best = Math.max(prev.best, current);
  const unlocked = BADGES.filter((b) => best >= b.days && !prev.badges.includes(b.id));
  return {
    state: { current, best, total: prev.total + 1, last: today, badges: [...prev.badges, ...unlocked.map((b) => b.id)] },
    unlocked,
  };
}

// If the last visit was before yesterday, the current streak shows as 0 until the next check in.
export function displayStreak(s: StreakState, today: string): number {
  if (!s.last) return 0;
  return dayNumber(today) - dayNumber(s.last) <= 1 ? s.current : 0;
}

export function nextBadge(s: StreakState): Badge | null {
  return BADGES.find((b) => !s.badges.includes(b.id)) ?? null;
}

export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const s = JSON.parse(raw);
    return { ...EMPTY, ...s, badges: Array.isArray(s.badges) ? s.badges : [] };
  } catch {
    return EMPTY;
  }
}

export function saveStreak(s: StreakState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode or storage blocked */
  }
}
