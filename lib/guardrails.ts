// Runs BEFORE the AI is called. Anything flagged here never reaches Gemini.

export type Screen =
  | { kind: "ok"; victim: boolean }
  | { kind: "crisis" } // self harm or suicide
  | { kind: "harm" } // threat to hurt someone else
  | { kind: "crime" } // asking how to commit or hide a crime
  | { kind: "invalid"; reason: string };

export const MAX_INPUT = 600;

const CRISIS = [
  /\bkill(ing)? myself\b/,
  /\bsuicid/,
  /\bend (it all|my life)\b/,
  /\bwant(ing)? to die\b/,
  /\b(hurt|harm|cut)(ing)? myself\b/,
  /\bself[\s-]?harm/,
  /\bdon'?t want to (be here|live|wake up)\b/,
  /\bno reason to live\b/,
  /\bbetter off (dead|without me)\b/,
  /\boverdose\b/,
];

const HARM_OTHERS = [
  /\b(going to|gonna|want to|wanna|plan(ning)? to|will) (kill|hurt|shoot|stab|beat up|attack|poison) (him|her|them|my|someone|somebody|everyone|people|you)\b/,
  /\bhow (do i|can i|to) (kill|hurt|poison|shoot|stab)\b/,
  /\bmake (him|her|them) (pay|suffer|bleed)\b/,
];

// "How do I do X" style requests for illegal acts, or covering them up.
const CRIME_HOWTO = [
  /\bhow (do i|can i|to|would i|should i)\b.{0,40}\b(steal|rob|shoplift|launder|embezzle|hack|scam|forge|counterfeit|smuggle|traffic|break into|hotwire|stalk|blackmail|extort|bribe)\b/,
  /\b(get away with|cover up|hide (the )?(evidence|body|money)|not get caught|avoid (the )?police|evade (taxes|police))\b/,
  /\bhow (do i|can i|to)\b.{0,30}\b(make|cook|buy|sell) (meth|drugs|cocaine|fentanyl|heroin|a bomb|explosives|a gun illegally)\b/,
  /\b(fake id|fake identity|stolen (card|identity)|credit card numbers?)\b/,
  /\bverse(s)? (that|to) (justify|says? it'?s ok(ay)? to)\b/,
];

// Someone who was harmed. Still gets scripture, plus a gentle safety note.
const VICTIM = [
  /\b(i was|i got|i've been|been) (robbed|assaulted|attacked|abused|scammed|stalked|threatened|raped|mugged|hit)\b/,
  /\b(he|she|they|someone) (hit|hits|abused|abuses|hurt|hurts|threatened|threatens|stole from) me\b/,
  /\bnot safe at home\b/,
];

export function normalize(input: string): string {
  return input.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

export function screenInput(raw: unknown): Screen {
  if (typeof raw !== "string") return { kind: "invalid", reason: "Please type a few words." };
  const text = normalize(raw);
  if (text.length < 3) return { kind: "invalid", reason: "Tell us a little more." };
  if (text.length > MAX_INPUT) return { kind: "invalid", reason: `Please keep it under ${MAX_INPUT} characters.` };

  if (CRISIS.some((r) => r.test(text))) return { kind: "crisis" };
  if (HARM_OTHERS.some((r) => r.test(text))) return { kind: "harm" };
  if (CRIME_HOWTO.some((r) => r.test(text))) return { kind: "crime" };
  return { kind: "ok", victim: VICTIM.some((r) => r.test(text)) };
}

// Checks the AI's short "how this connects" text before showing it.
export function cleanConnection(text: unknown): string | null {
  if (typeof text !== "string") return null;
  let t = text.trim().replace(/\s+/g, " ");
  if (t.length < 20) return null;
  if (t.length > 500) t = t.slice(0, 500).replace(/\s\S*$/, "") + "...";
  // No links, no phone numbers other than crisis lines, no quoted scripture from the model.
  if (/https?:\/\/|www\./i.test(t)) return null;
  if (/\b\d{1,3}:\d{1,3}\b/.test(t)) return null; // model tried to cite a verse itself
  if (/\b(lawyer|attorney|dosage|mg\b|diagnos|invest|stock|crypto)\b/i.test(t)) return null;
  return t;
}
