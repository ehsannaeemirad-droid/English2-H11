#!/usr/bin/env node
/* Recovery pass for words missing from scrape-pronunciation.mjs.
 * For each word in sounds/pronunciation/_missing.txt, tries:
 *   - the word itself + simple de-inflected base forms (days->day, getting->get, jim's->jim)
 *   - MW CDN (3 attempts each; CDN 403s are intermittent) then Cambridge
 * Writes sounds/pronunciation/[base]_us.mp3 under the ORIGINAL word's name,
 * or rewrites _missing.txt with whatever is still unfound.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "sounds", "pronunciation");
const MISS_FILE = join(OUT_DIR, "_missing.txt");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const MANUAL = { theirselves: "themselves", yourselves: "yourself" };

function candidates(word) {
  const set = new Set([word, MANUAL[word]].filter(Boolean));
  let base = word.replace(/'(s|d|ll|m|re|t|ve)$/i, "");
  set.add(base);
  if (base.endsWith("ies")) set.add(base.slice(0, -3) + "y");
  if (base.endsWith("es")) set.add(base.slice(0, -2));
  if (base.endsWith("s") && !base.endsWith("ss")) set.add(base.slice(0, -1));
  if (base.endsWith("ing")) {
    const stem = base.slice(0, -3);
    set.add(stem);
    set.add(stem.slice(0, -1)); // take/tak-ing, get/gett-ing
    set.add(stem + "e");        // have/hav-ing
  }
  if (base.endsWith("ed")) {
    const stem = base.slice(0, -2);
    set.add(stem, stem.slice(0, -1));
    set.add(base.slice(0, -1));
  }
  return [...set].filter(Boolean);
}

const isMp3 = (b) => b.length > 500 && (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33 || (b[0] & 0xff) === 0xff && (b[1] & 0xe0) === 0xe0);
async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://www.merriam-webster.com/" } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return isMp3(buf) ? buf : null;
}
function mwDir(w) { return /^bix/i.test(w) ? "bix" : /^[0-9]/.test(w) ? "number" : w[0]; }
async function tryMW(base) {
  const root = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${mwDir(base)}/${base}`;
  for (let n = 1; n <= 9; n++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const buf = await get(`${root}${String(n).padStart(3, "0")}.mp3`);
      if (buf) return buf;
      await sleep(700);
    }
  }
  return null;
}
async function tryCambridge(base) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(base)}`, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/\/media\/english\/us_pron\/[^"'\\ ]+\.mp3/i);
      if (m) {
        const buf = await get(`https://dictionary.cambridge.org${m[0]}`);
        if (buf) return buf;
      }
      return null; // page OK but no US audio
    }
    await sleep(1500);
  }
  return null;
}

const missing = readFileSync(MISS_FILE, "utf8").split("\n").map(s => s.trim()).filter(Boolean);
console.log(`Recovering ${missing.length} words`);
const stillMissing = [], usedBase = [];
for (const word of missing) {
  let buf = null, via = null;
  for (const cand of candidates(word)) {
    buf = await tryMW(cand);
    if (buf) { via = `${cand} (MW)`; break; }
    buf = await tryCambridge(cand);
    if (buf) { via = `${cand} (Cambridge)`; break; }
  }
  if (buf) {
    writeFileSync(join(OUT_DIR, `${word}_us.mp3`), buf);
    console.log(`  OK  ${word}  <- ${via}`);
    usedBase.push(word);
  } else {
    stillMissing.push(word);
    console.log(`  --  ${word}`);
  }
}
writeFileSync(MISS_FILE, stillMissing.sort().join("\n") + "\n");
console.log(`\nRecovered ${usedBase.length}, still missing ${stillMissing.length}`);
