import { createHmac } from "crypto";

// Daily free story limit per IP, counted in memory.
// On Vercel each server instance has its own memory, so the limit is loose.
// Plan: move the count to Supabase (table + increment function) before a real launch.
// IPs are never stored as is: the key is an HMAC of the IP, and old days are dropped.
// Async so the Supabase version can drop in without changing callers.

type Result = { ok: boolean; remaining: number };

const hits = new Map<string, { day: string; count: number }>();

export async function checkLimit(ip: string, limit: number): Promise<Result> {
  const day = new Date().toISOString().slice(0, 10); // UTC day
  const id = createHmac("sha256", process.env.UNLOCK_SECRET || "bwy-rate-limit").update(ip).digest("hex").slice(0, 32);

  const rec = hits.get(id);
  if (!rec || rec.day !== day) {
    if (hits.size > 50_000) {
      for (const [k, v] of hits) if (v.day !== day) hits.delete(k);
    }
    hits.set(id, { day, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }
  if (rec.count >= limit) return { ok: false, remaining: 0 };
  rec.count += 1;
  return { ok: true, remaining: limit - rec.count };
}
