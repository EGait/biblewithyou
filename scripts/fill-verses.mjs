// Replaces every verse in data/library.json with the exact World English Bible text
// from the local file data/web/eng-web.usfx.xml and stamps it with a checksum.
//
//   npm run fill-verses              every verse
//   npm run fill-verses -- --missing only new or changed verses
//
// Source: github.com/seven1m/open-bibles, eng-web.usfx.xml (commit 7768dac). This is
// the same dataset bible-api.com serves as translation=web. The World English Bible
// is public domain. The file is pinned by SHA-256 below; if it is edited or swapped,
// this script refuses to run. Never edit that file by hand.
//
// A verse only gets a checksum if it was found in the file. Bad references fail loudly.
// The build (npm run build / Vercel) refuses to deploy if any verse is missing a
// valid checksum, so text that was never pulled from the Bible cannot go live.

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { checksum } from "./verse-checksum.mjs";

const SOURCE = new URL("../data/web/eng-web.usfx.xml", import.meta.url);
const SOURCE_SHA256 = "5ffa2626f170a109a4a96afc90775c06f0821cb4ba81ed34e63663e085708d68";

const BOOKS = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU",
  Joshua: "JOS", Judges: "JDG", Ruth: "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  Ezra: "EZR", Nehemiah: "NEH", Esther: "EST", Job: "JOB", Psalm: "PSA", Psalms: "PSA",
  Proverbs: "PRO", Ecclesiastes: "ECC", "Song of Solomon": "SNG", Isaiah: "ISA",
  Jeremiah: "JER", Lamentations: "LAM", Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS",
  Joel: "JOL", Amos: "AMO", Obadiah: "OBA", Jonah: "JON", Micah: "MIC", Nahum: "NAM",
  Habakkuk: "HAB", Zephaniah: "ZEP", Haggai: "HAG", Zechariah: "ZEC", Malachi: "MAL",
  Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT", Romans: "ROM",
  "1 Corinthians": "1CO", "2 Corinthians": "2CO", Galatians: "GAL", Ephesians: "EPH",
  Philippians: "PHP", Colossians: "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
  "1 Timothy": "1TI", "2 Timothy": "2TI", Titus: "TIT", Philemon: "PHM", Hebrews: "HEB",
  James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN",
  "3 John": "3JN", Jude: "JUD", Revelation: "REV",
};

// "Book 3:22" or "Book 3:22-23" -> ["LAM 3:22", "LAM 3:23"]
function verseKeys(ref) {
  const m = ref.match(/^(.+?) (\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error("reference format not recognized");
  const code = BOOKS[m[1]];
  if (!code) throw new Error(`unknown book "${m[1]}"`);
  const from = Number(m[3]), to = m[4] ? Number(m[4]) : from;
  if (to < from) throw new Error("verse range is backwards");
  return Array.from({ length: to - from + 1 }, (_, i) => `${code} ${m[2]}:${from + i}`);
}

// Parse USFX into Map("BOOK ch:v" -> text). Footnotes, cross references and
// psalm titles are dropped, matching what bible-api.com returns.
function loadBible(xml) {
  const bible = new Map();
  const body = xml
    .replace(/<f\b[\s\S]*?<\/f>/g, "")
    .replace(/<x\b[\s\S]*?<\/x>/g, "")
    .replace(/<d\b[\s\S]*?<\/d>/g, "");
  const unescape = (s) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  let book = "", chapter = "", key = null, buf = "";
  const flush = () => {
    if (key) bible.set(key, bible.has(key) ? `${bible.get(key)} ${buf}` : buf);
    key = null;
    buf = "";
  };
  const token = /<book id="([^"]+)"|<c id="([^"]+)"\s*\/>|<v id="([^"]+)"[^>]*\/>|<ve\s*\/>|<[^>]+>|([^<]+)/g;
  let m;
  while ((m = token.exec(body))) {
    if (m[1]) { flush(); book = m[1]; }
    else if (m[2]) { flush(); chapter = m[2]; }
    else if (m[3]) { flush(); key = `${book} ${chapter}:${m[3]}`; }
    else if (m[0].startsWith("<ve")) flush();
    else if (m[4] && key) buf += unescape(m[4]);
  }
  flush();
  return bible;
}

const xml = (await readFile(SOURCE, "utf8")).replace(/\r\n/g, "\n");
const actual = createHash("sha256").update(xml).digest("hex");
if (actual !== SOURCE_SHA256) {
  console.error(`✗ data/web/eng-web.usfx.xml has been changed (sha256 ${actual}). Restore the original file.`);
  process.exit(1);
}
const bible = loadBible(xml);

const file = new URL("../data/library.json", import.meta.url);
const lib = JSON.parse(await readFile(file, "utf8"));
const onlyMissing = process.argv.includes("--missing");

let updated = 0;
const failed = [];
for (const story of lib.stories) {
  for (const v of story.verses) {
    if (onlyMissing && v.check === checksum(v.ref, v.text)) continue;
    try {
      const keys = verseKeys(v.ref);
      const missing = keys.find((k) => !bible.get(k)?.trim());
      if (missing) throw new Error(`reference not found (${missing})`);
      const text = keys.map((k) => bible.get(k)).join(" ").replace(/\s+/g, " ").trim();
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
  }
}

await writeFile(file, JSON.stringify(lib, null, 2) + "\n");
console.log(`\n${updated} verse(s) corrected.`);
if (failed.length) {
  console.error(`\n${failed.length} verse(s) could NOT be verified. Fix the reference and rerun:\n  ${failed.join("\n  ")}`);
  process.exit(1);
}
console.log("Every verse now matches the World English Bible exactly.");
