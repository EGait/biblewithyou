// Replaces every verse in data/library.json with the exact World English Bible text
// from bible-api.com and stamps it with a checksum.
//
//   npm run fill-verses
//
// A verse only gets a checksum if the API returned it. Bad references fail loudly.
// The build (npm run build / Vercel) refuses to deploy if any verse is missing a
// valid checksum, so text that was never pulled from the Bible cannot go live.

import { readFile, writeFile } from "node:fs/promises";
import { checksum } from "./verse-checksum.mjs";

const file = new URL("../data/library.json", import.meta.url);
const lib = JSON.parse(await readFile(file, "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const onlyMissing = process.argv.includes("--missing");

async function fetchVerse(ref) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=web`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) { await sleep(10000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.text || !data.verses?.length) throw new Error("reference not found");
    return data.text.replace(/\s+/g, " ").trim();
  }
  throw new Error("rate limited, try again later");
}

let updated = 0;
const failed = [];
for (const story of lib.stories) {
  for (const v of story.verses) {
    if (onlyMissing && v.check === checksum(v.ref, v.text)) continue;
    try {
      const text = await fetchVerse(v.ref);
      if (text !== v.text) {
        console.log(`fixed ${v.ref}\n  was: ${v.text}\n  now: ${text}\n`);
        updated++;
      }
      v.text = text;
      v.check = checksum(v.ref, text);
    } catch (e) {
      delete v.check;
      failed.push(`${story.id}: ${v.ref} (${e.message})`);
    }
    await sleep(2100); // stay under the free API's rate limit
  }
}

await writeFile(file, JSON.stringify(lib, null, 2) + "\n");
console.log(`\n${updated} verse(s) corrected.`);
if (failed.length) {
  console.error(`\n${failed.length} verse(s) could NOT be verified. Fix the reference and rerun:\n  ${failed.join("\n  ")}`);
  process.exit(1);
}
console.log("Every verse now matches the World English Bible exactly.");
