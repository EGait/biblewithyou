# BibleWithYou

Users describe a feeling or situation and get back a real Bible story, a short note on how it connects to them, and verses. Next.js (App Router) + TypeScript. Deployed from GitHub to Vercel. Owner: E (GitHub: EGait).

## Commands

```bash
npm install
npm run dev                          # local, works without a Gemini key (demo mode)
npm run fill-verses                  # pull exact WEB text for every verse (needs internet, ~5 min)
npm run fill-verses -- --missing     # only new or changed verses
npm run check-verses                 # fails if any verse is unverified
npm run build                        # runs check-verses first (prebuild)
npx tsx scripts/test-guardrails.ts   # safety screen tests
npm run lint                         # tsc --noEmit
```

## Layout

- `app/page.tsx` main UI (client). Screens: home, story, crisis, harm, crime, offtopic, limit.
- `app/api/story/route.ts` the only API route. Order: guardrails → rate limit → Gemini (or demo keyword match) → validate → respond.
- `lib/guardrails.ts` regex safety screen + `cleanConnection` output filter.
- `lib/gemini.ts` system prompt, JSON schema (storyId is an enum of library ids), safety settings.
- `lib/library.ts` loads `data/library.json`, keyword matcher, comfort verse.
- `lib/rateLimit.ts` in-memory daily limit (replace with Upstash Redis before launch).
- `data/library.json` the story library. Source of truth for all scripture.
- `scripts/` fill-verses, check-verses, verse-checksum, test-guardrails.

## Non-negotiable rules

1. **Never type, paraphrase, or generate verse text.** All verse text comes from `npm run fill-verses` (World English Bible via bible-api.com) and carries a checksum. To add a verse, add its `ref` with empty `text`, then run fill-verses. Never edit `text` or `check` by hand. Never weaken or skip `check-verses` or the `prebuild` hook.
2. **The AI never sees or returns scripture.** Gemini only returns `{category, storyId, connection}`. Story text and verses are always pulled from the library by id. Keep `storyId` as a schema enum and keep the `isValidStoryId` check.
3. **No internet tools for the model.** Do not add Google Search grounding, URL context, function calling, or any tools to the Gemini call.
4. **Guardrails run before the AI.** Crisis, harm-to-others, and crime-how-to messages return early and never reach Gemini. Do not move, loosen, or remove these checks. If you add patterns, add matching cases to `scripts/test-guardrails.ts` and keep them all passing.
5. **Crisis flow stays.** Any self-harm signal shows the 988 call/text screen (and 911 note). Never remove or bury it.
6. **Guilt is allowed, how-to is not.** Someone feeling guilty about a wrong gets a redemption story. Requests to commit or hide a crime get refused. Victims get a story plus the safety note.
7. **No advice.** No medical, mental health treatment, legal, financial, or relationship advice anywhere in prompts or UI copy.
8. **Real stories only.** Every library entry must be an actual Bible passage with a correct `ref`. Retellings are short plain summaries; keep them faithful to the text and do not add invented detail.
9. Keep `GEMINI_API_KEY` server side only. Never expose it to the client.

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
3. [ ] Upstash Redis rate limit.
4. [ ] Finalize privacy page; show AI disclosure on first launch.
5. [ ] Grow library to 150+ stories.
6. [ ] Supabase accounts + saved journal.
7. [ ] Capacitor iOS/Android build with native features so it passes App Store guideline 4.2: daily verse push notification, offline journal, share sheet, home screen widget.
