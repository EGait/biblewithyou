import { NextResponse, type NextRequest } from "next/server";
import { dailyPick, isDateString } from "@/lib/daily";

export const runtime = "nodejs";

// GET /api/daily?date=YYYY-MM-DD (the visitor's local date)
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!isDateString(date)) return NextResponse.json({ error: "Bad date" }, { status: 400 });
  const { story, verse } = dailyPick(date);
  return NextResponse.json(
    {
      date,
      verse: { ref: verse.ref, text: verse.text },
      story: { title: story.title, ref: story.ref, story: story.story, verses: story.verses.map(({ ref, text }) => ({ ref, text })) },
    },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
