#!/usr/bin/env node
/* Scrape US pronunciation MP3s for every word in words.txt — no API key needed.
 *
 *   node scripts/scrape-pronunciation.mjs [--dry-run] [--limit N]
 *
 * Sources, in order:
 *   1. Merriam-Webster media CDN: https://media.merriam-webster.com/audio/prons/
 *      en/us/mp3/{dir}/{word}{001..009}.mp3  (dir: bix, number, or first-letter)
 *   2. Cambridge Dictionary page scrape: first us_pron .mp3 on
 *      https://dictionary.cambridge.org/dictionary/english/{word}
 *
 * Output: sounds/pronunciation/[word]_us.mp3 (skips files that already exist)
 * Misses: sounds/pronunciation/_missing.txt
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORDS_FILE = join(ROOT, "words.txt");
const OUT_DIR = join(ROOT, "sounds", "pronunciation");
const MISS_FILE = join(OUT_DIR, "_missing.txt");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const CONCURRENCY = 6;

const DRY_RUN = process.argv.includes("--dry-run");
const limIdx = process.argv.indexOf("--limit");
const LIMIT = limIdx > -1 ? Number(process.argv[limIdx + 1]) : Infinity;

const words = readFileSync(WORDS_FILE, "utf8")
  .split("\n").map(l => l.replace(/#.*$/, "").trim().toLowerCase())
  .filter(Boolean).slice(0, LIMIT);
console.log(`Loaded ${words.length} words`);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const isMp3 = (buf) => buf.length > 500 && (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33 || (buf[0] & 0xff) === 0xff && (buf[1] & 0xe0) === 0xe0);

async function get(url, binary) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://www.merriam-webster.com/" } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!binary || isMp3(buf)) return buf;
  return null;
}

// --- source 1: Merriam-Webster CDN (filenames = word + 3-digit homograph no.) ---
function mwDir(word) {
  if (/^bix/i.test(word)) return "bix";
  if (/^[0-9]/.test(word)) return "number";
  return word[0];
}
async function tryMW(word) {
  const base = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${mwDir(word)}/${word}`;
  for (let n = 1; n <= 9; n++) {
    const buf = await get(`${base}${String(n).padStart(3, "0")}.mp3`, true);
    if (buf) return buf;
  }
  return null;
}

// --- source 2: Cambridge Dictionary US audio ---
async function tryCambridge(word) {
  const html = await get(`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`);
  if (!html) return null;
  const m = String(html).match(/\/media\/english\/us_pron\/[^"'\\ ]+\.mp3/i);
  if (!m) return null;
  return get(`https://dictionary.cambridge.org${m[0]}`, true);
}

const pending = [...words];
const missing = [], fromMW = new Set(), fromCam = new Set();
let done = 0, got = 0, skipped = 0;

async function worker() {
  while (pending.length) {
    const word = pending.shift();
    done++;
    const dest = join(OUT_DIR, `${word}_us.mp3`);
    if (existsSync(dest)) { skipped++; continue; }
    let buf = null, src = null;
    try {
      buf = await tryMW(word); src = buf && "mw";
      if (!buf) { buf = await tryCambridge(word); src = buf && "cambridge"; }
    } catch { /* network hiccup on one word shouldn't stop the run */ }
    if (buf && DRY_RUN) {
      console.log(`[dry] ${word} <- ${src}`);
      continue;
    }
    if (buf) {
      writeFileSync(dest, buf);
      got++;
      (src === "mw" ? fromMW : fromCam).add(word);
      if (got % 25 === 0) console.log(`  ${done}/${words.length} processed, ${got} downloaded`);
    } else {
      missing.push(word);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nDone. downloaded=${got} skipped(existed)=${skipped} missing=${missing.length}`);
console.log(`from Merriam-Webster: ${fromMW.size}, from Cambridge: ${fromCam.size}`);
if (missing.length) {
  writeFileSync(MISS_FILE, missing.sort().join("\n") + "\n");
  console.log(`Missing written to sounds/pronunciation/_missing.txt: ${missing.sort().slice(0, 30).join(", ")}${missing.length > 30 ? " …" : ""}`);
}
