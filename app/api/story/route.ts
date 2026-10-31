import { NextResponse } from "next/server";
import { cleanConnection, normalize, screenInput } from "@/lib/guardrails";
import { matchWithGemini } from "@/lib/gemini";
import { comfortVerse, getStory, isValidStoryId, keywordMatch, type Story } from "@/lib/library";
import { checkLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const DEFAULT_CONNECTION =
  "You're not the first person to feel this way. Someone in scripture walked a road like yours, and God met them there. Take a minute with their story and the verses below.";

const VICTIM_NOTE =
  "If you're not safe right now, please call 911. You can also call or text 988 to talk with someone.";

function publicStory(s: Story) {
  return { title: s.title, ref: s.ref, story: s.story, verses: s.verses };
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const limit = Number(process.env.DAILY_LIMIT || 10);

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ type: "error", message: "Bad request." }, { status: 400 });
  }

  // 1. Our own safety screen. Flagged messages never reach the AI.
  const screen = screenInput(body.text);
  if (screen.kind === "invalid") return NextResponse.json({ type: "error", message: screen.reason }, { status: 400 });
  if (screen.kind === "crisis") return NextResponse.json({ type: "crisis", verse: comfortVerse });
  if (screen.kind === "harm") return NextResponse.json({ type: "harm" });
  if (screen.kind === "crime") return NextResponse.json({ type: "crime" });

  // 2. Rate limit (only counts real requests).
  const rl = checkLimit(ip, limit);
  if (!rl.ok) return NextResponse.json({ type: "limit" }, { status: 429 });

  const text = normalize(body.text as string);
  const safetyNote = screen.victim ? VICTIM_NOTE : undefined;

  // 3. Demo mode: no API key, use keyword matching on the library.
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      type: "story",
      story: publicStory(keywordMatch(text)),
      connection: DEFAULT_CONNECTION,
      safetyNote,
      demo: true,
    });
  }

  // 4. Ask Gemini to pick from our library.
  try {
    const ai = await matchWithGemini(text);
    if (!ai) throw new Error("no result");
    if (ai.category === "safety") return NextResponse.json({ type: "crisis", verse: comfortVerse });
    if (ai.category === "refuse") return NextResponse.json({ type: "crime" });
    if (ai.category === "offtopic") return NextResponse.json({ type: "offtopic" });

    // Story text and verses always come from our file, never from the model.
    const story = isValidStoryId(ai.storyId) ? getStory(ai.storyId) : keywordMatch(text);
    const connection = cleanConnection(ai.connection) ?? DEFAULT_CONNECTION;
    return NextResponse.json({ type: "story", story: publicStory(story), connection, safetyNote });
  } catch (err) {
    console.error("gemini error", err);
    // Safety blocks or outages fall back to keyword matching so the user still gets help.
    return NextResponse.json({
      type: "story",
      story: publicStory(keywordMatch(text)),
      connection: DEFAULT_CONNECTION,
      safetyNote,
    });
  }
}
