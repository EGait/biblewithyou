# BibleWithYou

Users describe a feeling or situation and get back a real Bible story, a short note on how it connects to them, and verses. Next.js (App Router) + TypeScript. Deployed from GitHub to Vercel. Owner: E (GitHub: EGait).

## Commands

```bash
npm install
npm run dev                          # local, works without a Gemini key (demo mode)
npm run fill-verses                  # pull exact WEB text for every verse from the local file (offline, seconds)
npm run fill-verses -- --missing     # only new or changed verses
npm run check-verses                 # fails if any verse is unverified
npm run build                        # runs check-verses first (prebuild)
npx tsx scripts/test-guardrails.ts   # safety screen tests
npx tsx scripts/test-streak.ts       # streak + badge logic tests
npm run lint                         # tsc --noEmit
```

## Layout

- `app/page.tsx` main UI (client). Screens: home, story, crisis, harm, crime, offtopic, limit.
- `app/api/story/route.ts` story route. Order: guardrails → rate limit → Gemini (or demo keyword match) → validate → respond.
- `lib/guardrails.ts` regex safety screen + `cleanConnection` output filter.
- `lib/gemini.ts` system prompt, JSON schema (storyId is an enum of library ids), safety settings.
- `lib/library.ts` loads `data/library.json`, keyword matcher, comfort verse.
- `lib/rateLimit.ts` in-memory daily limit (replace with Upstash Redis before launch). Plus members skip it.
- `lib/pricing.ts` plan prices ($0.99/mo, $4.99 lifetime) and donation split (`DONATION_CAUSE_PCT`, default 50).
- `lib/entitlement.ts` HMAC signed Plus token in the `bwy_plus` httpOnly cookie (needs `UNLOCK_SECRET`). Every token is signed with a purpose (`"plus"` or `"intent"`) so one kind can never be used as another; `readPlus` also checks the token's shape.
- `lib/solanaPay.ts` Solana Pay USDC links + on chain verification over JSON RPC (reference key, merchant USDC balance delta).
- `lib/stripe.ts`, `lib/checkout.ts` Stripe client and server side order pricing.
- `app/api/pay/*` Solana create/verify, Stripe checkout/confirm. `app/api/plus/status` reports Plus and renews Stripe monthly.
- `lib/daily.ts` + `app/api/daily` daily verse: same story and verse for everyone per local date, hashed pick from the verified library.
- `lib/streak.ts` streak + badge logic (pure, localStorage for now). `components/DailyVerse.tsx` home card with streak and unlock toast. `app/badges` badge page.
- `app/plus`, `app/donate` pages; `components/PayButtons.tsx` shared Solana Pay + card buttons.
- `lib/features.ts` `PLUS_LIVE` switch. Currently `false`: Plus, donations and accounts are paused (links hidden, pages show `components/ComingSoon.tsx`, pay and login routes refuse). `stripeEnabled`, `solanaEnabled` and `accountsEnabled` all respect it.
- `SETUP.md` every outside service, env var, and where keys live. Keep it current when services or env vars change. Never put real keys in it.
- `lib/supabase.ts` Supabase clients, server side only (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`); accounts switch off when unset. No proxy/middleware: sessions are read and refreshed in route handlers.
- `lib/purchases.ts` saves Plus purchases to the `entitlements` table (`supabase/migrations/001_entitlements.sql`), keyed by unique `source_ref` (Solana reference or Stripe session id). `/api/plus/status` links this browser's purchase to the signed in account and restores Plus from the account on new devices.
- `app/account` optional email sign in (magic link via `/api/auth/login`, lands on `app/auth/confirm` using `token_hash`), Plus status, sign out (`/api/auth/signout`, also clears the Plus cookie).
- `brand/` logo and icon source files (lamp over open book). Copies used by the app live in `public/` and `app/favicon.ico`.
- `data/library.json` the story library. Source of truth for all scripture shown in the app.
- `data/web/eng-web.usfx.xml` the full World English Bible (public domain, from github.com/seven1m/open-bibles, the dataset bible-api.com serves). fill-verses reads verses from it. Pinned by SHA-256 in `scripts/fill-verses.mjs`. Read only; not bundled into the app.
- `scripts/` fill-verses, check-verses, verse-checksum, test-guardrails, test-streak.

## Non-negotiable rules

1. **Never type, paraphrase, or generate verse text.** All verse text comes from `npm run fill-verses` (World English Bible, read from `data/web/eng-web.usfx.xml`) and carries a checksum. To add a verse, add its `ref` with empty `text`, then run fill-verses. Never edit `text` or `check` by hand. Never edit, replace, or re-pin `data/web/eng-web.usfx.xml`, and never swap in a different WEB edition (eBible.org's current WEB uses "the LORD" and revised wording, not the text this library uses). Never weaken or skip `check-verses`, the source hash check, or the `prebuild` hook.
2. **The AI never sees or returns scripture.** Gemini only returns `{category, storyId, connection}`. Story text and verses are always pulled from the library by id. Keep `storyId` as a schema enum and keep the `isValidStoryId` check.
3. **No internet tools for the model.** Do not add Google Search grounding, URL context, function calling, or any tools to the Gemini call.
4. **Guardrails run before the AI.** Crisis, harm-to-others, and crime-how-to messages return early and never reach Gemini. Do not move, loosen, or remove these checks. If you add patterns, add matching cases to `scripts/test-guardrails.ts` and keep them all passing.
5. **Crisis flow stays.** Any self-harm signal shows the 988 call/text screen (and 911 note). Never remove or bury it.
6. **Guilt is allowed, how-to is not.** Someone feeling guilty about a wrong gets a redemption story. Requests to commit or hide a crime get refused. Victims get a story plus the safety note.
7. **No advice.** No medical, mental health treatment, legal, financial, or relationship advice anywhere in prompts or UI copy.
8. **Real stories only.** Every library entry must be an actual Bible passage with a correct `ref`. Retellings are short plain summaries; keep them faithful to the text and do not add invented detail.
9. Keep `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `UNLOCK_SECRET` and all `SUPABASE_*` keys server side only. Never expose them to the client (no `NEXT_PUBLIC_` prefix).
14. **Accounts stay optional.** Never require sign in for stories, the daily verse, badges, the crisis screen, or buying Plus. Only the server writes `entitlements`; keep RLS on with no client write policies. Never store what users type against their account unless a journal feature is explicitly built for it.
10. **Free stays free.** Plus is an optional upgrade. Never put the crisis screen, safety features, or the core story flow behind a paywall.
11. **Prices are set on the server.** Never trust an amount or plan price from the client. Plus is only granted after the server confirms payment with Stripe or on chain.
12. **Donations:** the split shown in the UI must match `DONATION_CAUSE_PCT`. Always show "not tax deductible". Don't promise a specific charity until `CAUSE_NAME` is set.
13. **Daily verse and badges:** the daily verse must come from the verified library via `dailyPick`, never hardcoded text. Badges are earned by best streak and never taken away. Keep badge copy encouraging, never guilt or shame for missed days.

## Adding stories

Each entry: `id` (kebab-case, unique), `title`, `ref`, `tags` (feelings and situations people would type), `story` (3 to 5 plain sentences), `verses` (`[{ "ref": "Book 1:2", "text": "" }]`). Then `npm run fill-verses -- --missing` and `npm run check-verses`. Aim for broad coverage of feelings across both testaments.

## Style

- Look: ground `#F3F5F7`, ink `#1B2430`, accent teal `#1F5F5B`, soft teal `#E6EFEE`, gold label `#8A5A12`. Literata for headings and scripture, Inter for UI.
- Copy is warm, short, plain. Not preachy.
- Mobile first. Touch targets at least 44px.
- When handing changes to E, list the files that changed.

## Roadmap

1. [ ] Run fill-verses, confirm build passes, push to GitHub (`biblewithyou`), connect Vercel, add env vars.
2. [ ] Gemini free tier for testing only. Switch to a paid key before public launch (free tier data may be used by Google).
3. [ ] Payments go live: set `UNLOCK_SECRET`, `SOLANA_MERCHANT_WALLET`, `SOLANA_RPC_URL` (Helius), Stripe test keys, then live keys. Test a $0.99 USDC payment on mainnet and a Stripe test card (4242 4242 4242 4242).
4. [~] **Email sign up / login.** Done: Supabase magic link sign in, `entitlements` table, Solana and Stripe purchases linked on pay, cookie purchases linked on sign in, restore on new device, sign out. Still to do: Stripe webhook, customer portal link to cancel, account deletion. Before launch: connect custom SMTP (needs a real domain; e.g. Resend), then set the Magic Link template link to `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` so links work across browsers. Until then the default template is used and the link only works in the browser that requested it. Original plan: Today Plus lives in a browser cookie, so it is lost on a new device or cleared cookies. Plan: Supabase Auth with email magic links (no passwords). Add an `entitlements` table (user_id, plan, source, stripe_customer_id, stripe_subscription_id, solana_signature, wallet, expires_at). Stripe: pass the user's email/customer to Checkout and add a webhook (`checkout.session.completed`, `customer.subscription.updated/deleted`) that writes entitlements. Solana: on verify, attach the payment to the signed in user. Add "Restore purchase" and a Stripe customer portal link to cancel. Keep login optional: free users never need an account. Keep the cookie as a fast cache of the DB record.
5. [ ] Upstash Redis rate limit.
6. [ ] Finalize privacy page (add payments and email data); show AI disclosure on first launch.
7. [ ] Grow library to 150+ stories.
8. [ ] Saved journal and verse cards for Plus (needs login). Move streaks and badges to the database on login (merge with the device's local streak, keep the higher values).
8b. [ ] Daily verse push notification (web push with a service worker for the PWA, native push in the Capacitor app). User picks a time; off by default.
9. [ ] Quarterly donation receipts on /donate.
9b. [ ] (Back pocket, only if needed) `npm run grant-plus -- email plan` local admin script to manually grant Plus when a verified payment didn't register (e.g. Solana paid after the 10 min checker timeout). Requires the person to have an account. Until then: insert a row in Supabase Table Editor → `entitlements`.
10. [ ] Capacitor iOS/Android build with native features so it passes App Store guideline 4.2: daily verse push notification, offline journal, share sheet, home screen widget.
