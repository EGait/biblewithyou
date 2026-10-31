// Runs automatically before every build. Fails if any verse was not pulled
// from the World English Bible by fill-verses, or was edited afterward.

import { readFile } from "node:fs/promises";
import { checksum } from "./verse-checksum.mjs";

const lib = JSON.parse(await readFile(new URL("../data/library.json", import.meta.url), "utf8"));

const bad = [];
let total = 0;
for (const story of lib.stories) {
  for (const v of story.verses) {
    total++;
    if (v.check !== checksum(v.ref, v.text)) bad.push(`${story.id}: ${v.ref}`);
  }
}

if (bad.length) {
  console.error(`\n✗ ${bad.length} of ${total} verses are not verified against the World English Bible:\n  ${bad.join("\n  ")}`);
  console.error(`\nRun:  npm run fill-verses\n`);
  process.exit(1);
}
console.log(`✓ All ${total} verses verified against the World English Bible.`);
