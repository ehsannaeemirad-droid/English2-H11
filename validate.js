/* Data validation for the English 2 lesson app (schema v3). Run: node validate.js */
const fs = require("fs");
const path = require("path");
const root = process.argv[2] || ".";
const read = f => fs.readFileSync(path.join(root, f), "utf8");
function loadWindow(f) {
  const src = read(f).replace(/^\uFEFF/, "");
  const w = {};
  new Function("window", src)(w);
  return w;
}
let fails = 0, warns = 0;
const fail = m => { fails++; console.log("FAIL: " + m); };
const warn = m => { warns++; console.log("warn: " + m); };
const ok = m => console.log("ok  " + m);

/* ---- load data ---- */
let L, G;
try { L = loadWindow("content/lesson1.js").__LESSONS__; }
catch (e) { fail("content/lesson1.js did not evaluate: " + e.message); process.exit(1); }
try { G = loadWindow("content/glossary.js").__GLOSSARY__; }
catch (e) { fail("content/glossary.js did not evaluate: " + e.message); process.exit(1); }

/* ---- glossary duplicate keys ---- */
{
  const src = read("content/glossary.js");
  const keys = [...src.matchAll(/(?:^|[\s,{])("([^"]+)"|([A-Za-z][A-Za-z0-9_$]*))\s*:/gm)]
    .map(m => m[2] || m[3]).filter(k => k !== "__GLOSSARY__");
  if (keys.length < 200) warn("glossary key count looks low (" + keys.length + ")");
  const seen = new Set(), dups = new Set();
  keys.forEach(k => { if (seen.has(k)) dups.add(k); seen.add(k); });
  if (dups.size) fail("glossary duplicate keys: " + [...dups].join(", "));
  else ok("glossary keys unique (" + keys.length + ")");
}

/* ---- app.js greps (plan gates) ---- */
const appSrc = read("app.js");
if (/loseHeart/.test(appSrc)) fail("app.js still references loseHeart (hearts must be gone)");
else ok("no loseHeart anywhere in app.js");
if (/sort\(\s*\(\s*\)\s*=>\s*Math\.random/.test(read("app.js")))
  fail("biased sort(()=>Math.random) found in app.js — use shuffle()");
else ok("no biased shuffle sorts in app.js");
if (/window\.confirm|[^.a-zA-Z]confirm\(/.test(appSrc) && !/confirmDlg\(/.test(appSrc))
  fail("window.confirm used — use confirmDlg");
else ok("no window.confirm in app.js");
if (/fonts\.googleapis|fonts\.gstatic/.test(read("index.html")))
  fail("Google Fonts links still present in index.html");
else ok("no Google Fonts links in index.html");
if (!/manifest\.webmanifest/.test(read("index.html"))) fail("manifest link missing");
if (!/role="status"/.test(appSrc) && !/role=\\"status\\"/.test(appSrc))
  warn('feedback sheet role="status" not found in app.js (it is in index.html)');

/* ---- skill tags ---- */
const lesson = L[0];
const skillSet = new Set((lesson.skills || []).map(s => s.id));
if (skillSet.size < 20) warn("skill list is small (" + skillSet.size + ")");

/* ---- item schema (Step 2) ---- */
const IT_TYPES = new Set([null, "choice", "transform", "listen_choice", "listen_type",
  "inline_choice", "error_spot", "tap_words", "match", "dialogue", "stress"]);
const BOARD_TYPES = new Set(["match", "sort", "cloze", "teach", "flashcards", "reading",
  "skim_scan", "speak", "dialog_reveal", "wordbuild", "intro"]);
const ids = new Set();
let steps = 0, graded = 0, missingFields = 0;
const stepIds = [];
const missingGloss = new Map();

function checkGraded(where, it, isSlot) {
  graded++;
  const miss = [];
  if (it.id === undefined || it.id === null) miss.push("id");
  if (it.skill === undefined) miss.push("skill");
  if (it.core === undefined) miss.push("core");
  if (!isSlot) {
    if (it.qFa === undefined) miss.push("qFa");
    if (it.hintFa === undefined) miss.push("hintFa");
    if (it.exFa === undefined) miss.push("exFa");
  }
  if (it.core === true && it.book === undefined && !isSlot) miss.push("book");
  if (miss.length) {
    missingFields++;
    fail(where + ": missing [" + miss.join(", ") + "]");
  }
  if (it.id !== undefined) {
    if (ids.has(it.id)) fail("duplicate item id " + it.id);
    ids.add(it.id);
  }
  if (it.skill !== undefined && !skillSet.has(it.skill))
    fail(where + ": unknown skill tag '" + it.skill + "'");
  /* opts invariants */
  if (Array.isArray(it.opts)) {
    if (typeof it.ans !== "number" || it.ans < 0 || it.ans >= it.opts.length)
      fail(where + ": ans out of range");
    const norm = it.opts.map(o => String(o).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, ""));
    for (let i = 0; i < norm.length; i++)
      for (let j = i + 1; j < norm.length; j++)
        if (norm[i] && norm[i] === norm[j]) fail(where + ": duplicate options " + i + "/" + j);
    if (it.optsGuided) {
      if (it.optsGuided.length !== 2) fail(where + ": optsGuided must hold exactly 2 options");
      else if (!it.optsGuided.includes(it.opts[it.ans]))
        fail(where + ": optsGuided must include the answer");
    }
    if (it.typed) {
      if (!Array.isArray(it.typed.accept) || !it.typed.accept.length)
        fail(where + ": typed.accept must be a non-empty list");
      else {
        const acc = it.typed.accept.map(a => String(a).toLowerCase());
        if (!acc.includes(String(it.opts[it.ans]).toLowerCase()))
          warn(where + ": typed.accept does not literally include the answer");
      }
    }
  }
}

lesson.sections.forEach(sec => {
  if (!sec.id || !sec.title) fail("section missing id/title");
  if (!Array.isArray(sec.steps) || !sec.steps.length) fail(sec.id + ": no steps");
  sec.steps.forEach(st => {
    steps++; stepIds.push(st.id);
    const where = sec.id + "/" + (st.id || "?");
    if (!st.id) fail(where + ": missing id");
    if (ids.has(st.id)) fail("duplicate id " + st.id);
    ids.add(st.id);
    if (!st.type) fail(where + ": missing type");
    const isBoard = BOARD_TYPES.has(st.type);
    if (!isBoard && st.type !== "items") fail(where + ": unknown step type '" + st.type + "'");
    if (st.type === "items") {
      if (!Array.isArray(st.items) || !st.items.length) { fail(where + ": items empty"); return; }
      st.items.forEach((it, i) => {
        const w2 = where + "#" + (i + 1);
        if (it.id && !/^s\d+[a-z]-\d/.test(it.id)) warn(w2 + ": id '" + it.id + "' does not look like '<step>-NN'");
        if (it.type && !IT_TYPES.has(it.type)) fail(w2 + ": unknown item type '" + it.type + "'");
        checkGraded(w2, it, false);
        if (it.type === "inline_choice") {
          if (!Array.isArray(it.slots) || it.slots.length < 1) fail(w2 + ": inline_choice needs slots");
          else it.slots.forEach((s2, k) => {
            checkGraded(w2 + ".slot" + (k + 1), s2, true);
            if (s2.optsGuided !== undefined) fail(w2 + ".slot" + (k+1) + ": optsGuided lives on the item, not slots");
          });
        }
        if (it.type === "error_spot" && (!it.fixOpts || typeof it.fixAns !== "number"))
          fail(w2 + ": error_spot needs fixOpts/fixAns");
        if (it.type === "tap_words" && !it.targets) fail(w2 + ": tap_words needs targets");
        if (it.type === "stress" && (!it.meaningOpts || typeof it.meaningAns !== "number"))
          fail(w2 + ": stress needs meaningOpts/meaningAns");
        if (it.type === "listen_choice" && !it.lines) fail(w2 + ": listen_choice needs lines");
        if (it.type === "transform" && (!Array.isArray(it.tiles) || !it.ans))
          fail(w2 + ": transform needs tiles + ans");
        if (it.type === "dialogue" && !it.lines) fail(w2 + ": dialogue needs lines");
      });
      /* chunking: <=6 items per step in Standard (Step 7) */
      if (st.items.length > 8) fail(where + ": " + st.items.length + " items (max 8 in Challenge, 6 Standard)");
    }
    if (isBoard && st.type === "match") {
      const targets = st.right.map(r => r.m).filter(m => m >= 0);
      const dup = targets.filter((t, i) => targets.indexOf(t) !== i);
      if (dup.length) fail(where + ": two right options point at the same left item");
      st.left.forEach((l, i) => { if (!targets.includes(i)) fail(where + ": left " + i + " has no partner"); });
      st.right.forEach((r, i) => {
        if (typeof r.m !== "number") fail(where + "[right " + i + "]: missing m");
      });
    }
    if (st.type === "cloze") {
      if (st.parts.length !== st.blanks.length + 1)
        fail(where + ": parts must be blanks+1");
      st.blanks.forEach((b, i) => checkGraded(where + ".blank" + (i + 1), b, true));
    }
    if (st.type === "sort" && st.items.some(x => typeof x.b !== "number"))
      fail(where + ": sort items need numeric b");
    if (st.type === "speak" && !Array.isArray(st.items)) fail(where + ": speak needs items");
    if (st.type === "teach" && !Array.isArray(st.cards)) fail(where + ": teach needs cards");
    /* glossary coverage */
    const texts = [];
    const push = v => { if (typeof v === "string") texts.push(v); };
    push(st.q); push(st.en); push(st.scanQ);
    (st.opts || []).forEach(push);
    (st.lines || []).forEach(l => push(l.en || l.t));
    (st.paras || []).forEach(p => Array.isArray(p) ? p.forEach(push) : (p.en || []).forEach(push));
    (st.items || []).forEach(it => {
      push(it.q); push(it.sentence); push(it.word); push(it.from);
      (it.opts || []).forEach(push);
      (it.tiles || []).forEach(push);
      Object.keys(it.targets || {}).forEach(push);
      (it.verbBox || []).forEach(push);
    });
    texts.join(" ").replace(/<[^>]*>/g, " ").split(/\s+/).forEach(tok => {
      const k = tok.replace(/[^A-Za-z'\-]/g, "").replace(/^'+|'+$/g, "").toLowerCase();
      if (k && !G[k]) missingGloss.set(k, (missingGloss.get(k) || 0) + 1);
    });
  });
});

/* practice items */
(lesson.practice || []).forEach((it, i) => {
  const w2 = "practice#" + (i + 1);
  if (it.type && !IT_TYPES.has(it.type)) fail(w2 + ": unknown type " + it.type);
  checkGraded(w2, it, false);
});

/* no two consecutive steps of the same type (Step 7) */
lesson.sections.forEach(sec => {
  for (let i = 1; i < sec.steps.length; i++) {
    const a = sec.steps[i - 1], b = sec.steps[i];
    const fa = a.type === "items" ? (a.items && a.items[0] ? (a.items[0].type || "choice") : "choice") : a.type;
    const fb = b.type === "items" ? (b.items && b.items[0] ? (b.items[0].type || "choice") : "choice") : b.type;
    if (a.type === b.type && ["teach", "flashcards", "reading", "skim_scan", "speak", "match", "sort", "cloze", "dialog_reveal", "wordbuild"].includes(a.type))
      warn(sec.id + ": consecutive steps of type " + a.type + " (" + a.id + ", " + b.id + ")");
    else if (a.type === "items" && b.type === "items" && fa === fb && fa !== "choice")
      warn(sec.id + ": consecutive same item-type rounds (" + a.id + ", " + b.id + ": " + fa + ")");
  }
});

console.log("ok  sections: " + lesson.sections.map(s => s.id + "(" + s.steps.length + ")").join(" "));
console.log("ok  steps: " + steps + ", graded items: " + graded);
if (missingGloss.size) {
  const list = [...missingGloss.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => k + "(" + n + ")");
  warn("words absent from glossary (" + missingGloss.size + "): " + list.join(", "));
}
console.log(fails ? "\n" + fails + " FAILURE(S), " + warns + " warning(s)" : "\nALL CHECKS PASSED (" + warns + " warning(s))");
process.exit(fails ? 1 : 0);
