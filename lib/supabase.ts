import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Supabase is used server side only. Keys never reach the browser.
// Accounts are optional: when these env vars are missing, the app works as before.

const url = () => process.env.SUPABASE_URL || "";
const publishableKey = () => process.env.SUPABASE_PUBLISHABLE_KEY || "";

export const accountsEnabled = () => Boolean(url() && publishableKey() && process.env.SUPABASE_SECRET_KEY);

// Acts as the visitor, using their session cookie. Use in route handlers.
export async function sessionClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(url(), publishableKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read only. Safe to ignore.
        }
      },
    },
  });
}

// Full access. Only for server code that has already checked who the user is.
let admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url() || !key) throw new Error("Supabase is not set up");
  admin ??= createClient(url(), key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

// The signed in user, verified with Supabase. Null if signed out or accounts are off.
export async function currentUser(): Promise<User | null> {
  if (!accountsEnabled()) return null;
  try {
    const { data } = await (await sessionClient()).auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

// Only allow redirects to a path on this site.
export function safeNext(next: string | null, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
