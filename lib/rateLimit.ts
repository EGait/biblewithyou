// Simple per IP daily limit kept in memory.
// Good enough to start. On Vercel each server instance has its own memory,
// so swap this for Upstash Redis (free tier) before a real launch.

const hits = new Map<string, { day: string; count: number }>();

export function checkLimit(ip: string, limit: number): { ok: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const rec = hits.get(ip);
  if (!rec || rec.day !== day) {
    hits.set(ip, { day, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }
  if (rec.count >= limit) return { ok: false, remaining: 0 };
  rec.count += 1;
  return { ok: true, remaining: limit - rec.count };
}
