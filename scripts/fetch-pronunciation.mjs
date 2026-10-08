#!/usr/bin/env node
/* Fetch US pronunciation MP3s from the Merriam-Webster Speech API.
 *
 * Usage:
 *   MW_API_KEY=xxxx node scripts/fetch-pronunciation.mjs [--dry-run]
 *
 * The key is read from (first match wins):
 *   1. MW_API_KEY environment variable
 *   2. .mw-api-key file in the repo root (gitignored — do not commit it)
 *
 * Reads words.txt (one word per line, '#' comments allowed) and downloads
 * one MP3 per word to sounds/pronunciation/[word]_us.mp3.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORDS_FILE = join(ROOT, "words.txt");
const OUT_DIR = join(ROOT, "sounds", "pronunciation");
const MISS_FILE = join(ROOT, "sounds", "pronunciation", "_missing.txt");
const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = 4;

// ---- API key ----
let apiKey = process.env.MW_API_KEY;
if (!apiKey && existsSync(join(ROOT, ".mw-api-key"))) {
  apiKey = readFileSync(join(ROOT, ".mw-api-key"), "utf8").trim();
}
if (!apiKey) {
  console.error("No Merriam-Webster API key found.\n" +
    "Set MW_API_KEY or put the key in .mw-api-key (repo root, gitignored).\n" +
    "Get a free key at https://dictionaryapi.com (Speech API).");
  process.exit(1);
}

// ---- words ----
const words = readFileSync(WORDS_FILE, "utf8")
  .split("\n")
  .map(l => l.replace(/#.*$/, "").trim().toLowerCase())
  .filter(Boolean);
console.log(`Loaded ${words.length} words from words.txt`);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ---- MW audio URL helpers ----
// Audio filename "light_1" -> https://media.merriam-webster.com/audio/prons/en/us/mp3/{dir}/light_1.mp3
// Directory rule: "bix..." -> bix, starts with digit -> number, else first letter.
function audioDir(audio) {
  if (/^bix/i.test(audio)) return "bix";
  if (/^[0-9]/.test(audio)) return "number";
  return audio[0].toLowerCase();
}
function audioUrl(audio) {
  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioDir(audio)}/${audio}.mp3`;
}

// Find the first pronunciatio[n].sound.audio in an entry (recursively).
function findAudio(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj.prs)) {
    for (const pr of obj.prs) {
      const a = pr?.sound?.audio;
      if (a) return a;
    }
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = findAudio(v);
      if (found) return found;
    }
  }
  return null;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (res.status === 401 || res.status === 403) throw new Error("INVALID_KEY");
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) {
    const body = (await res.text()).trim();
    // MW returns 200 + text/plain for bad/missing keys ("Invalid reference name.", "Key is required.")
    if (/invalid reference|key is required|invalid api key/i.test(body)) throw new Error("INVALID_KEY");
    throw new Error(`unexpected content-type ${ct}: ${body.slice(0, 80)}`);
  }
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`audio HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100 || buf[0] !== 0xff) throw new Error("not an MP3");
  writeFileSync(dest, buf);
  return buf.length;
}

const pending = [...words];
const missing = [];
const failed = [];
let done = 0, fetched = 0, skipped = 0;

async function worker() {
  while (pending.length) {
    const word = pending.shift();
    const dest = join(OUT_DIR, `${word}_us.mp3`);
    done++;
    if (existsSync(dest) && !DRY_RUN) { skipped++; continue; }
    try {
      const data = await fetchJson(
        `https://www.dictionaryapi.com/api/v3/references/speech/json/${encodeURIComponent(word)}?key=${apiKey}`
      );
      if (!Array.isArray(data) || !data.length) throw new Error("no entry");
      // Strings in the response = "did you mean" suggestions, not real entries.
      const audio = typeof data[0] === "string" ? null : findAudio(data[0]);
      if (!audio) throw new Error("no audio");
      if (DRY_RUN) { console.log(`[dry] ${word} -> ${audioUrl(audio)}`); continue; }
      const bytes = await download(audioUrl(audio), dest);
      fetched++;
      if (fetched % 25 === 0) console.log(`  ${done}/${words.length} processed, ${fetched} downloaded`);
      void bytes;
    } catch (err) {
      const msg = String(err.message || err);
      if (msg === "INVALID_KEY" || msg === "RATE_LIMITED") {
        console.error(`\n${msg}: aborting run.`);
        pending.length = 0;
        missing.push(word);
        break;
      }
      (msg === "no entry" || msg === "no audio" ? missing : failed).push(word);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nDone. fetched=${fetched} skipped(existed)=${skipped} missing=${missing.length} failed=${failed.length}`);
if (missing.length) {
  writeFileSync(MISS_FILE, missing.sort().join("\n") + "\n");
  console.log(`Words without MW audio written to sounds/pronunciation/_missing.txt (first 20: ${missing.sort().slice(0, 20).join(", ")})`);
} else if (existsSync(MISS_FILE)) {
  console.log("(no missing words — stale _missing.txt not cleared)");
}
if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
process.exit(failed.length ? 1 : 0);
