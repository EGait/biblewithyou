# BibleWithYou

Someone in the Bible has been where you are. Users describe a feeling or situation and get a real Bible story, a short note on how it connects, and verses.

Next.js + TypeScript. VS Code → GitHub → Vercel.

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your Gemini key, or leave blank for demo mode
npm run dev                  # http://localhost:3000
```

Demo mode (no key) uses keyword matching against the library so you can try it right away.

## Deploy

1. Create a GitHub repo `biblewithyou` and push this folder.
2. In Vercel: New Project → import the repo.
3. Add env vars: `GEMINI_API_KEY`, `GEMINI_MODEL`, `DAILY_LIMIT`.
4. Deploy, then add your domain.

## How it works

```
user text
  → lib/guardrails.ts   crisis, harm, crime checks (blocked here, never sent to AI)
  → lib/rateLimit.ts    daily limit per IP
  → lib/gemini.ts       Gemini picks ONE storyId from the library + writes 2 to 3 sentences
  → api/story/route.ts  checks the id is real, pulls story + verses from data/library.json
```

* Gemini gets no tools, so no Google Search and no internet.
* The model can only answer with a storyId from the list (enforced by the JSON schema).
* Story text and verses always come from `data/library.json`, never from the AI.
* The AI's note is checked: no links, no verse citations, no medical, legal or money talk.
* If Gemini fails or blocks a message, the app falls back to keyword matching.

## Plus and donations

* Free version stays free. Plus is $0.99/month or $4.99 lifetime (`lib/pricing.ts`).
* Pay with Solana Pay (USDC, great on Seeker) or card (Stripe Checkout, includes Apple Pay and Google Pay).
* Donations split by `DONATION_CAUSE_PCT` (default 50% cause, 50% development).
* No accounts yet: Plus is saved in a signed cookie. Email login is the next task (see CLAUDE.md roadmap).

Env vars: `UNLOCK_SECRET`, `SOLANA_MERCHANT_WALLET`, `SOLANA_RPC_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `DONATION_CAUSE_PCT`, `CAUSE_NAME`. See `.env.example`.

## Verses are never made up

* The AI never writes or sees verse text. It only picks a story id.
* Every verse in `data/library.json` is pulled from the World English Bible by `npm run fill-verses` and stamped with a checksum. The full WEB text lives in `data/web/eng-web.usfx.xml` (public domain, from github.com/seven1m/open-bibles), so filling verses works offline and takes seconds. The script refuses to run if that file has been changed.
* `npm run build` runs `check-verses` first. If any verse is unverified, has a bad reference, or was edited by hand afterward, the build fails and Vercel will not deploy.
* `npm run dev` still works before verification so you can test locally.

## Adding stories

Add an entry to `data/library.json` with an id, title, ref, tags, a plain retelling and verse refs (text can be blank). Then run:

```bash
npm run fill-verses -- --missing   # only fills new or changed verses
npm run check-verses               # confirms everything is verified
```

Retellings are plain summaries written for the app. Read each one against its chapter before launch.

## Test the guardrails

```bash
npx tsx scripts/test-guardrails.ts
```

## Before public launch

* [ ] Run `npm run fill-verses` (build will fail until you do)
* [ ] Read each retelling against its chapter
* [ ] Switch Gemini to a paid key (free tier data can be used by Google)
* [ ] Replace in-memory rate limit with Upstash Redis
* [ ] Finalize privacy page
* [ ] Grow the library to 100+ stories
* [ ] Phase 2: Supabase accounts + journal, Capacitor for app stores
