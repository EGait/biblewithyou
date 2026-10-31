import data from "@/data/library.json";

export type Verse = { ref: string; text: string; check?: string };
export type Story = {
  id: string;
  title: string;
  ref: string;
  tags: string[];
  story: string;
  verses: Verse[];
};

export const stories: Story[] = data.stories;
export const storyIds: string[] = stories.map((s) => s.id);
const byId = new Map(stories.map((s) => [s.id, s]));

export function getStory(id: string | undefined | null): Story {
  return (id && byId.get(id)) || byId.get(data.fallbackId)!;
}

export function isValidStoryId(id: unknown): id is string {
  return typeof id === "string" && byId.has(id);
}

// Short catalog the AI picks from. It only ever sees ids, titles and tags, never verse text.
export function catalogForPrompt(): string {
  return stories
    .map((s) => `${s.id} | ${s.title} (${s.ref}) | ${s.tags.join(", ")}`)
    .join("\n");
}

// Demo mode matcher used when no API key is set.
export function keywordMatch(text: string): Story {
  const t = text.toLowerCase();
  let best: Story | null = null;
  let bestScore = 0;
  for (const s of stories) {
    let score = 0;
    for (const tag of s.tags) if (t.includes(tag)) score += tag.length;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best ?? getStory(null);
}

// The crisis screen verse is pulled from the verified library too, never typed in code.
export const comfortVerse: Verse = (() => {
  for (const s of stories) for (const v of s.verses) if (v.ref === "Psalm 34:18") return v;
  return getStory(null).verses[0];
})();
