import { createHash } from "node:crypto";
import { stories, type Story, type Verse } from "@/lib/library";

// Picks the same story and verse for everyone on a given date.
// Verses come only from the verified library, never typed in code.

export function isDateString(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export function dailyPick(date: string): { story: Story; verse: Verse } {
  const pool = stories.filter((s) => s.verses.length > 0);
  const h = createHash("sha256").update(`bwy-daily|${date}`).digest();
  const story = pool[h.readUInt32BE(0) % pool.length];
  const verse = story.verses[h.readUInt32BE(4) % story.verses.length];
  return { story, verse };
}
