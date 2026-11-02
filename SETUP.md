# BibleWithYou setup

Every outside service the app uses, what it is for, where its keys go, and whether it is on.
Never put real keys in this file. Keys live in two places only:

- **Your computer:** `.env.local` (git ignores it)
- **The live site:** Vercel → Project → Settings → Environment Variables (redeploy after any change)

Last updated: 2026-11-02.

## What is on right now

| Service | Used for | Status | Account / dashboard |
|---|---|---|---|
| GitHub | Stores the code. Pushing to `main` deploys. | ✅ On | github.com/EGait/biblewithyou |
| Vercel | Hosts the live site | ✅ On | biblewithyou.vercel.app |
| Google Gemini | Matches what people type to a story | ✅ On, **free tier** | aistudio.google.com |
| Supabase | Accounts and saved Plus purchases | ⏸ Set up, paused with Plus | supabase.com/dashboard |
| Solana wallet + Helius | Solana Pay for Plus and donations | ⏸ Set up, paused with Plus | your wallet app, helius.dev |
| Stripe | Card payments | ⬜ Not set up | stripe.com |
| Email sender (Gmail) | Sign in emails | ⬜ Not set up | see "Sign in emails" below |

## The Plus switch

Plus, donations, and accounts are turned off together by one line in `lib/features.ts`:

```ts
export const PLUS_LIVE = false;
```

While it is `false`, the Plus, Donate, and Account links are hidden, those pages say "coming soon", and the payment and sign in routes refuse requests. The core app (stories, daily verse, badges, crisis screen) is not affected.

To turn it back on: set it to `true`, make sure the env vars below are set in Vercel, push, and test.

## Env vars

| Name | Needed for | Where to get it | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | Stories (without it the app runs in demo mode) | AI Studio → Get API key | Server only |
| `GEMINI_MODEL` | Which Gemini model | Leave as in `.env.example` | |
| `DAILY_LIMIT` | Free stories per person per day | Your choice (default 10) | |
| `UNLOCK_SECRET` | Signing Plus cookies | Already generated in `.env.local` | Copy the same value to Vercel. Changing it signs everyone out of Plus. |
| `SOLANA_MERCHANT_WALLET` | Solana Pay | Your wallet's **public** address | Never the recovery phrase |
| `SOLANA_RPC_URL` | Checking Solana payments | Helius dashboard → Mainnet RPC URL | |
| `STRIPE_SECRET_KEY` | Card payments | Stripe → Developers → API keys | `sk_test_` until launch |
| `NEXT_PUBLIC_SITE_URL` | Stripe and sign in redirects | `https://biblewithyou.vercel.app` | |
| `DONATION_CAUSE_PCT`, `CAUSE_NAME` | Donation split shown to donors | Your choice | |
| `SUPABASE_URL` | Accounts | Supabase → Project Settings → Data API | Just `https://xxxx.supabase.co`, **no** `/rest/v1/` |
| `SUPABASE_PUBLISHABLE_KEY` | Accounts | Supabase → Project Settings → API Keys | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Accounts | Same page, reveal | `sb_secret_...`. Treat like a password. |

## Supabase settings (already done)

- Table created from `supabase/migrations/001_entitlements.sql`.
- Authentication → URL Configuration: Site URL `https://biblewithyou.vercel.app`; Redirect URLs `https://biblewithyou.vercel.app/**` and `http://localhost:3000/**`.
- Free projects pause after about a week with no activity. Restore from the dashboard if that happens.

## Sign in emails (to do before turning Plus on)

Supabase's built in email only reaches members of your Supabase team and only a few per hour. Before real users can sign in:

1. Make a Gmail just for the app, turn on 2-Step Verification, and create an App Password (myaccount.google.com/apppasswords).
2. Supabase → Authentication → Emails → SMTP Settings: host `smtp.gmail.com`, port `587`, username and sender = the Gmail, password = the App Password, sender name `BibleWithYou`.
3. Authentication → Emails → Magic Link → Source, use this link so it works in any browser:
   `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to BibleWithYou</a>`
4. Authentication → Rate Limits: raise emails per hour (e.g. 30).

Later, with a real domain, switch from Gmail to Resend.

## Before sharing with real users

- [ ] Gemini: turn on billing (free tier data may be read by Google)
- [ ] Rate limit that works on Vercel (current one is per server instance)
- [ ] Privacy page: add a contact email, have it reviewed
- [ ] AI disclosure on first launch

## Testing on your computer

`npm run dev` reload-loops on this machine. Use production mode instead:

```bash
npm run build
npx next start -p 3000
```
