/* Audit every quiz item in Lesson 1 for ambiguity / leakage / bad distractors. */
const fs = require("fs");
const path = require("path");
const root = process.argv[2] || ".";
const w = {};
new Function("window", fs.readFileSync(path.join(root, "content/lesson1.js"), "utf8").replace(/^\uFEFF/, ""))(w);
const L = w.__LESSONS__[0];

const mech = [];
const note = (sev, where, msg) => mech.push(sev + " | " + where + " | " + msg);
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/* ---------- position bias: does the app shuffle this type? ---------- */
const NO_SHUFFLE = new Set();   // every renderer shuffles now

let posCount = {};
function recordPos(type, ans, n) {
  posCount[type] = posCount[type] || { total: 0, first: 0, hist: {} };
  posCount[type].total++;
  if (ans === 0) posCount[type].first++;
  posCount[type].hist[ans] = (posCount[type].hist[ans] || 0) + 1;
}

function optsOf(it) { return it.opts || it.scanOpts || null; }
function ansOf(it) { return it.opts ? it.ans : it.scanAns; }

function checkChoice(where, q, opts, ans, shuffled) {
  if (!Array.isArray(opts) || !opts.length) { note("BUG", where, "no options at all"); return; }
  if (typeof ans !== "number" || ans < 0 || ans >= opts.length) { note("BUG", where, "ans index out of range: " + ans); return; }
  recordPos(where.split("::")[0], ans, opts.length);
  if (!shuffled) {
    if (ans === 0) note("LEAK", where, "answer is displayed FIRST and options are never shuffled");
    else note("info", where, "no shuffle; answer is at displayed position " + (ans + 1) + "/" + opts.length);
  }
  for (let i = 0; i < opts.length; i++)
    for (let j = i + 1; j < opts.length; j++)
      if (same(opts[i], opts[j])) note("BUG", where, "duplicate option: " + JSON.stringify(opts[i]));
  // An option appearing inside the question is only a leak when the question is
  // NOT an identification task that quotes the material being asked about.
  const ql = String(q || "").toLowerCase();
  const identification = /['\u2018\u2019\u201c\u201d"]/.test(String(q || "")) || /which part|which one|which sentence|underline/i.test(String(q || ""));
  opts.forEach((o, i) => {
    if (i === ans) return;
    const ol = String(o).toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (ol.length > 3 && ql.includes(ol))
      note(identification ? "info" : "LEAK", where,
        (identification ? "identification task, option is quoted from the stem: " : "option " + i + " repeats the question text: ") + JSON.stringify(o));
  });
  // two options that differ only by trailing/leading noise
  const norm = opts.map(o => String(o).toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (let i = 0; i < norm.length; i++)
    for (let j = i + 1; j < norm.length; j++)
      if (norm[i] && norm[i] === norm[j]) note("BUG", where, "options " + i + "/" + j + " are the same after normalising");
  if (ans === 0 && false) {}
  // redundant: a distractor that strictly contains the answer text
  const a = String(opts[ans] || "").toLowerCase();
  opts.forEach((o, i) => {
    if (i === ans) return;
    const s = String(o).toLowerCase();
    if (a.length > 3 && (s.includes(a) || a.includes(s))) note("REVIEW", where, "option " + i + " overlaps the answer in wording: " + JSON.stringify(o) + " vs " + JSON.stringify(opts[ans]));
  });
}

L.sections.forEach(sec => {
  sec.steps.forEach(st => {
    const tag = sec.id + "/" + st.id + " [" + st.type + "]";
    if (st.type === "mcq" || st.type === "listen_mcq")
      checkChoice(tag, st.q, st.opts, st.ans, !NO_SHUFFLE.has(st.type));
    if (st.type === "skim_scan")
      checkChoice(tag + "::scan", st.scanQ, st.scanOpts, st.scanAns, true);
    if (st.type === "mcqset")
      (st.items || []).forEach((it, i) => checkChoice(tag + "::item" + i, it.q, it.opts, it.ans, true));
    if (st.type === "pic_choice")
      (st.items || []).forEach((it, i) =>
        checkChoice(tag + "::item" + i, it.sentence, [it.sentence, ...(it.distractors || [])], 0, true));
    if (st.type === "pic_match")
      (st.items || []).forEach((it, i) => {
        const others = st.items.filter((_, k) => k !== i).map(x => x.sentence);
        checkChoice(tag + "::item" + i, it.sentence, [it.sentence, ...others], 0, true);
      });
    if (st.type === "wordbuild")
      (st.items || []).forEach((it, i) => {
        if (it.check) checkChoice(tag + "::item" + i + ".check", it.check.q, it.check.opts, it.check.ans, true);
      });
    if (st.type === "roleplay")
      (st.lines || []).forEach((l, i) => {
        if (l.opts) checkChoice(tag + "::line" + i, l.en, l.opts, l.ans, true);
      });
    if (st.type === "cloze")
      (st.blanks || []).forEach((b, i) => checkChoice(tag + "::blank" + i, "", b.opts, b.ans, true));
    if (st.type === "match") {
      const rights = st.right.map((r, i) => (typeof r === "string" ? { t: r, m: i } : r));
      rights.forEach((r, i) => {
        rights.forEach((o, j) => {
          if (i !== j && same(r.t, o.t)) note("BUG", tag, "duplicate right option: " + JSON.stringify(r.t));
        });
      });
      const targets = rights.map(r => r.m).filter(m => m >= 0);
      const dup = targets.filter((t, i) => targets.indexOf(t) !== i);
      if (dup.length) note("BUG", tag, "two right options point at the same left item: " + dup.join(","));
      st.left.forEach((l, i) => {
        if (!targets.includes(i)) note("BUG", tag, "left item " + i + " (" + l.txt + ") has no partner");
      });
      const unmatched = rights.filter(r => r.m < 0);
      if (unmatched.length) note("info", tag, unmatched.length + " distractor(s): " + unmatched.map(r => r.t).join(" / "));
    }
    if (st.type === "sort") {
      const b = {};
      (st.items || []).forEach(it => { b[it.b] = (b[it.b] || 0) + 1; });
      Object.keys(b).forEach(k => {
        if (+k < 0 || +k >= st.bins.length) note("BUG", tag, "bin index " + k + " out of range");
      });
      const dupes = {};
      (st.items || []).forEach(it => { dupes[it.t.toLowerCase()] = (dupes[it.t.toLowerCase()] || 0) + 1; });
      Object.keys(dupes).forEach(k => { if (dupes[k] > 1) note("BUG", tag, "verb listed twice: " + k); });
    }    if (st.type === "reorder")
      (st.items || []).forEach((it, i) => {
        // The renderer shuffles the chips, so only the *set* matters: the answer
        // must be reachable as a space-join of the chips in SOME order. Chips may
        // be multi-word, so check every permutation (chip counts are tiny).
        const target = it.ans.replace(/\s+/g, " ").trim().toLowerCase();
        const words = it.words.map(x => x.replace(/\s+/g, " ").trim());
        let ok = false;
        if (words.length <= 6) {
          const perm = (rest, acc) => {
            if (ok) return;
            if (!rest.length) { if (acc.join(" ").toLowerCase() === target) ok = true; return; }
            rest.forEach((w, k) => perm(rest.filter((_, j) => j !== k), acc.concat(w)));
          };
          perm(words, []);
        } else {
          ok = words.map(w => w.toLowerCase()).sort().join("|") === target.split(" ").sort().join("|");
        }
        if (!ok) note("BUG", tag + "::item" + i, "no order of the chips produces the answer: " + JSON.stringify(it.words) + " => " + JSON.stringify(it.ans));
      });
    if (st.type === "selftest") {}
  });
});

/* ---------- full dump ---------- */
let out = "";
let n = 0;
L.sections.forEach(sec => {
  out += "\n########## " + sec.id + " " + sec.title + "\n";
  sec.steps.forEach(st => {
    const t = st.type;
    const show = (label, q, opts, ans, extra) => {
      n++;
      out += "  [" + label + "] " + q + "\n";
      if (!Array.isArray(opts)) { out += "      !!! NO OPTIONS ARRAY\n"; mech.push("BUG | " + label + " | item has no opts array"); return; }
      opts.forEach((o, i) => { out += "      " + (i === ans ? "*" : " ") + " " + o + "\n"; });
      if (extra) out += "      ~ " + extra + "\n";
    };
    if (t === "mcq" || t === "listen_mcq") show(t + " " + st.id, st.q, st.opts, st.ans, st.ex);
    if (t === "skim_scan") show("skim_scan " + st.id, st.scanQ, st.scanOpts, st.scanAns, st.scanEx);
    if (t === "mcqset") (st.items || []).forEach((it, i) => show(t + " " + st.id + "#" + i, it.q, it.opts, it.ans, it.ex));
    if (t === "pic_choice") (st.items || []).forEach((it, i) => show(t + " " + st.id + "#" + i + " " + it.emoji, "(which sentence matches?)", [it.sentence, ...(it.distractors || [])], 0, it.ex));
    if (t === "wordbuild") (st.items || []).forEach((it, i) => { if (it.check) show("wordbuild " + st.id + "#" + i, it.check.q, it.check.opts, it.check.ans, it.check.ex); });
    if (t === "roleplay") (st.lines || []).forEach((l, i) => { if (l.opts) show("roleplay " + st.id + " line" + i + " — " + l.s, "(choose the reply)", l.opts, l.ans, l.fa); });
    if (t === "cloze") st.blanks.forEach((b, i) => show("cloze " + st.id + "#" + i, st.parts[i] + " __ " + st.parts[i + 1], b.opts, b.ans, st.ex));
    if (t === "match") out += "  <match " + st.id + ">\n" + st.left.map((l, i) => "      " + i + ". " + (l.txt || l.em || "")).join("\n") + "\n    -> " + st.right.map((r, i) => (typeof r === "string" ? r + " (m=" + i + ")" : r.t + " (m=" + r.m + ")")).join("\n       ") + "\n";
    if (t === "sort") out += "  <sort " + st.id + "> bins=" + st.bins.join(" | ") + "\n" + st.items.map((x, i) => "      " + x.t + " -> " + st.bins[x.b]).join("\n") + "\n";
    if (t === "reorder") out += "  <reorder " + st.id + ">\n" + st.items.map(it => "      " + JSON.stringify(it.words) + "  =>  \"" + it.ans + "\"  (" + it.fa + ")").join("\n") + "\n";
    if (t === "pic_match") out += "  <pic_match " + st.id + ">\n" + st.items.map((x, i) => "      " + i + ". " + x.emoji + " => " + x.sentence).join("\n") + "\n";
    if (t === "pic_choice") {}
  });
});

console.log("=== ITEM COUNT ===\n" + n + " graded items\n");
console.log("=== PLACEMENT (before shuffle) === ");
Object.keys(posCount).forEach(k => console.log("  " + k + ": " + posCount[k].total + " items, answer-at-index hist " + JSON.stringify(posCount[k].hist) + "  first-position=" + posCount[k].first));
console.log("\n=== MECHANICAL FINDINGS ===");
if (!mech.length) console.log("  (none)");
mech.forEach(m => console.log("  " + m));
console.log("\n=== FULL DUMP ===" + out);
