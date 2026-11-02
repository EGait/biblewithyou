import { NextResponse, type NextRequest } from "next/server";
import { PLUS_COOKIE } from "@/lib/entitlement";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { accountsEnabled, adminClient, currentUser, sessionClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Permanently deletes the signed in account. Any monthly Stripe plan is canceled first so
// nobody keeps getting billed for an account that no longer exists. Purchase rows are
// removed with the user (on delete cascade). Signs out and clears Plus from this browser.
export async function POST(req: NextRequest) {
  if (!accountsEnabled()) return NextResponse.json({ error: "Accounts are coming soon." }, { status: 503 });

  // Must be a JSON request that says it means it. Plain cross-site forms can't send JSON.
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "delete") return NextResponse.json({ error: "Please confirm." }, { status: 400 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const admin = adminClient();
  const { data: rows, error: readError } = await admin
    .from("entitlements")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .not("stripe_subscription_id", "is", null);
  if (readError) {
    console.error("delete: read entitlements", readError.message);
    return NextResponse.json({ error: "We couldn't delete your account. Please try again." }, { status: 500 });
  }

  const subs = [...new Set((rows ?? []).map((r) => r.stripe_subscription_id as string))];
  if (subs.length) {
    if (!stripeEnabled()) {
      console.error("delete: user has Stripe plans but Stripe is not set up", user.id);
      return NextResponse.json({ error: "We couldn't cancel your monthly plan. Please email us and we'll delete your account." }, { status: 500 });
    }
    try {
      for (const id of subs) {
        const sub = await stripe().subscriptions.retrieve(id);
        if (sub.status !== "canceled" && sub.status !== "incomplete_expired") await stripe().subscriptions.cancel(id);
      }
    } catch (e) {
      console.error("delete: cancel subscription", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "We couldn't cancel your monthly plan. Please try again." }, { status: 500 });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("delete: user", deleteError.message);
    return NextResponse.json({ error: "We couldn't delete your account. Please try again." }, { status: 500 });
  }

  // The user is gone, so only clear this browser's session cookies.
  try { await (await sessionClient()).auth.signOut({ scope: "local" }); } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PLUS_COOKIE);
  return res;
}
