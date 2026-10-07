/* Coverage map (plan Step 6): one row per numbered coursebook exercise on
   pages 15-39, mapped to the app step that covers it. Writes coverage.csv.
   Exits 1 if any row is empty or points at a step that does not exist. */
const fs = require("fs");
const path = require("path");
const root = process.argv[2] || ".";
function loadWindow(f) {
  const w = {};
  new Function("window", fs.readFileSync(path.join(root, f), "utf8").replace(/^\uFEFF/, ""))(w);
  return w;
}
const w = {};
loadWindow.call ? null : null;
new Function("window", fs.readFileSync(path.join(root, "content/lesson1.js"), "utf8").replace(/^\uFEFF/, ""))(w);
const L = w.__LESSONS__[0];
const stepIds = new Set();
L.sections.forEach(s => s.steps.forEach(st => stepIds.add(st.id)));
const secIds = new Set(L.sections.map(s => s.id));

/* page, exercise, what it is, covering step, form in the app */
const ROWS = [
  ["15", "Opening quote", "Seek knowledge from the cradle to the grave", "s1a", "quote card in intro (lesson.quote rendered on showQuote)"],
  ["15-16", "Get Ready — word meanings", "objects: airplane, light bulb, telephone, camera", "s1b + s1c", "match with distractor + flashcards"],
  ["16", "Get Ready — comprehension", "which word questions", "s1d", "choice items s1d-01..03"],
  ["17", "Get Ready — adjective order", "adjective before noun", "s1e + s1f", "teach cards + transform tiles"],
  ["18", "Get Ready — choose the adjective", "modern/old/Iranian", "s1g", "choice items s1g-01..03"],
  ["18", "Get Ready — speak about pictures", "say the sentences aloud", "s1h", "speak step with starters"],
  ["19", "Conversation — before listening", "library scene, Rhazes note", "s2a", "intro"],
  ["20", "Conversation — word bank", "medicine, famous, build, Believe me!, Cool!", "s2b", "flashcards (word bank)"],
  ["20", "Conversation — listen 1 (gist)", "When I came in…", "s2d", "listen_choice s2d-01"],
  ["20", "Conversation — listen 2 (detail)", "Did you find it useful…", "s2e", "listen_choice s2e-01"],
  ["20", "Conversation — full text", "line-by-line with glossary", "s2f", "dialog_reveal"],
  ["20", "Conversation — questions 1-2", "comprehension questions", "s2g", "choice items s2g-01..04"],
  ["20", "Conversation — oral question 3", "Do you know any interesting story about famous scientists?", "s2h", "speak prompt with 3 sentence starters"],
  ["20", "Conversation — role play", "play Mahsa's lines", "s2h", "speak (model lines)"],
  ["21", "Vocabulary — sentences 1-8", "Melika tries hard… Edison invented…", "s3b + s3c", "two wordbuild steps"],
  ["21", "Vocabulary — key words", "solve, develop, belief, quit, give up, thousands of", "s3d", "flashcards"],
  ["22", "Vocabulary — matching", "word to meaning", "s3e", "match with distractor"],
  ["22", "Vocabulary — fill in the blanks", "quit smoking, solve problem…", "s3f", "choice items s3f-01..04"],
  ["22", "Vocabulary — meanings", "what does develop/give up/solve mean", "s3g", "choice items s3g-01..03"],
  ["23", "Reading P1 — comprehension", "Human knowledge develops…", "s4b + s4d", "skim_scan + choice items"],
  ["23", "Reading P1 — words", "knowledge, invent, easy lives", "s4c", "wordbuild with graded checks"],
  ["24", "Reading P2 — comprehension", "Edison story facts", "s4e + s4l", "skim_scan + True/False items"],
  ["24", "Reading P2 — words", "try hard, weak, give up, energetic, hearing", "s4f + s4g", "wordbuild with graded checks"],
  ["25", "Reading P3 — comprehension", "key to success", "s4h + s4j", "skim_scan + choice items"],
  ["25", "Reading P3 — words", "great names, key", "s4i", "wordbuild with graded checks"],
  ["23-25", "Reading — whole text", "full passage with audio", "s4k", "reading step, per-sentence audio"],
  ["25", "Reading — sentence halves", "After Edison lost his hearing…", "s4m", "match with distractor"],
  ["26", "Bonus text — Saffarzadeh", "read-along chunks", "s4n + s4o", "reading in 2-sentence chunks + 3 questions"],
  ["26", "Bonus text — Fleming", "read-along chunks with dates", "s4p + s4q", "reading in 2-sentence chunks + 3 questions"],
  ["27", "Grammar — structure/meaning", "was/were + verb-ing meaning", "s5b", "3 choice questions"],
  ["27", "Grammar A — choose was/were", "5 items on affirmative", "s5d", "choice items s5d-01..05"],
  ["27", "Grammar — build sentences", "I was working…", "s5e", "transform tiles s5e-01..04"],
  ["27", "Grammar B — negatives", "wasn't/weren't", "s5g", "3 choices + 2 transforms"],
  ["27", "Grammar C — questions", "Was/Were + subject…?", "s5i", "4 tiles + 2 short-answer choices"],
  ["28", "Grammar D — find the pp verbs of the Conversation", "underline past progressive", "s5a", "tap-words on the conversation lines"],
  ["28", "Grammar — error spotting", "find the mistake, pick the fix", "s5l", "error_spot s5l-01..04"],
  ["28", "Grammar — self pronouns", "myself…themselves", "s5m + s5n", "teach cards + match & choose"],
  ["28", "Grammar — emphatic position", "Bell himself invented…", "s5o", "transform tiles s5o-01..03"],
  ["28", "Grammar check-up", "mixed round", "s5p", "6 mixed choice items"],
  ["29", "Grammar E — Kashani paragraph (1-5)", "choose the best form, first half", "s5j", "inline-choice paragraph part 1"],
  ["29", "Grammar E — Kashani paragraph (6-9)", "choose the best form, second half", "s5k", "inline-choice paragraph part 2"],
  ["29", "Grammar F — pair prompts", "yesterday at 5 / teacher came in / 5:30 / father came home", "s5q", "speak prompts with model + 3 starters"],
  ["30", "Listening — the hall story", "kitty in the kitchen", "s6c", "listen_choice"],
  ["30", "Listening — background vs main", "which verb is background", "s6d + s6e", "teach cards + choice items"],
  ["31", "Listening — reorder the story", "We were sitting…", "s6f", "transform tiles"],
  ["31", "Listening — conversation practice", "What were you doing…?", "s6g", "choice items"],
  ["32", "Conversation 1 — Leila and the driver", "sentence beginnings + verb box", "s6h", "dialogue-builder (lines MUST be checked against the book - see needsBookCheck)"],
  ["32", "Conversation 2 — Amir", "simple past vs past progressive", "s6i", "dialogue-builder (lines MUST be checked against the book - see needsBookCheck)"],
  ["32", "Conversation 2 — pair work with verb box", "talk to someone, read a book…", "s6j", "speak with starters"],
  ["33", "Pronunciation — emphatic stress", "Were YOU doing…?", "s7a + s7b", "teach cards + stress items"],
  ["33", "Pronunciation — say with stress", "repeat with the stress", "s7c", "speak items"],
  ["33-34", "Pronunciation — Jim's car / Mina's dress", "stress changes meaning", "s7d + s7e", "speak + stress items with meaning match"],
  ["35", "Writing — action verbs", "went, drinks, runs", "s8a", "teach cards"],
  ["35", "Writing — state verbs", "believe, love, feel, know", "s8b", "teach cards"],
  ["36", "Writing A — action or state", "sort the verbs", "s8c", "sort step"],
  ["36", "Writing — find verbs in the Reading", "underline and classify", "s8d", "tap-words with action/state targets"],
  ["37", "Writing — simple or continuous", "Kids love chocolate examples", "s8e", "teach cards with examples"],
  ["37", "Writing B/C — choose the form", "don't like, needed…", "s8f + s8g", "choice items"],
  ["39", "Review #1 — fill the blanks", "Sajjad was taking pictures…", "s9d", "cloze"],
  ["39", "Review #2 — list pp verbs", "find past progressive verbs", "s9e", "tap-words"],
  ["39", "Review C — pair questions", "What was Sajjad doing…", "s9f", "speak prompts"],
  ["39", "Review — final listening", "the fire story", "s9b + s9c", "listen_choice + questions"]
];

let bad = 0;
const csv = ["page,exercise,what,covers,form"];
ROWS.forEach(([pg, ex, what, steps, form])=>{
  const refs = steps.split(/ \+ |,/).map(s=>s.trim());
  const missing = refs.filter(r => !stepIds.has(r) && !secIds.has(r) && !/s\d[a-z]-\d/.test("") );
  const realMissing = refs.filter(r => !stepIds.has(r) && !secIds.has(r));
  if (realMissing.length){ bad++; console.log("EMPTY ROW: " + pg + " " + ex + " -> " + steps + " (" + realMissing.join(",") + " not found)"); }
  csv.push([pg, ex, what, steps, form].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","));
});
fs.writeFileSync(path.join(root, "coverage.csv"), "\uFEFF" + csv.join("\r\n"), "utf8");
console.log("coverage.csv written: " + ROWS.length + " rows, " + bad + " empty row(s)");
process.exit(bad ? 1 : 0);
