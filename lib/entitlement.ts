import { createHmac, timingSafeEqual } from "node:crypto";
import { isPlanId, type PlanId } from "@/lib/pricing";

// Stateless signed tokens. No database needed to start.
// Plus status lives in an httpOnly cookie signed with UNLOCK_SECRET.

export const PLUS_COOKIE = "bwy_plus";

export type PlusToken = {
  plan: PlanId;
  exp: number; // ms
  src: "solana" | "stripe";
  sub?: string; // Stripe subscription id, used to renew monthly
  sid?: string; // Stripe Checkout session id, identifies the purchase
  ref?: string; // Solana Pay reference, identifies the purchase
};

// The id that makes a purchase unique (Solana reference or Stripe session id).
export function purchaseRef(t: PlusToken): string | undefined {
  return t.src === "solana" ? t.ref : t.sid;
}

function secret(): string {
  const s = process.env.UNLOCK_SECRET;
  if (!s || s.length < 32) throw new Error("UNLOCK_SECRET must be set (32+ chars)");
  return s;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
// Each token type is signed under its own purpose, so a token minted for one use
// (for example a free Solana payment intent) can never be replayed as a Plus cookie.
export type Purpose = "plus" | "intent";
const mac = (purpose: Purpose, data: string) =>
  createHmac("sha256", secret()).update(`${purpose}|${data}`).digest("base64url");

export function sign(payload: object, purpose: Purpose): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${mac(purpose, body)}`;
}

export function verify<T>(token: string | undefined | null, purpose: Purpose): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = mac(purpose, body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(unb64(body)) as T;
  } catch {
    return null;
  }
}

// A signed Plus token with a valid shape, even if it has expired (used to renew Stripe monthly).
export function readPlusAllowExpired(token: string | undefined | null): PlusToken | null {
  const t = verify<PlusToken>(token, "plus");
  if (!t || typeof t.exp !== "number" || !Number.isFinite(t.exp)) return null;
  if (!isPlanId(t.plan) || (t.src !== "solana" && t.src !== "stripe")) return null;
  return t;
}

export function readPlus(token: string | undefined | null): PlusToken | null {
  const t = readPlusAllowExpired(token);
  if (!t || t.exp < Date.now()) return null;
  return t;
}

export function cookieOptions(exp: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(60, Math.floor((exp - Date.now()) / 1000)),
  };
}
