/* ============================================================================
   English 2 — app engine. Implements plan Steps 1 to 5, 7 to 12.
   State schema v3 (Step 2). Content format: content/lesson1.js header.
   ============================================================================ */
(function(){
"use strict";

/* ============ DATA ============ */
const GLOSSARY = window.__GLOSSARY__ || {};
const LESSONS  = window.__LESSONS__ || [];
let AUDIO_MANIFEST = {};   /* loaded async from audio/manifest.json */

const STORE_KEY = "eng2_v3";
const OLD_KEY   = "eng2_v2";

/* fixed skill tag list (Step 2) — ids must exist in lesson.skills too */
const SKILLS = [
  "vocab-lesson1","vocab-conversation","vocab-reading","word-bank","adj-order",
  "pp-form","pp-affirmative","pp-negative","pp-question","pp-usage","pp-error",
  "self-pronouns","self-emphatic","stress","listening","reading-main","reading-detail",
  "action-state","state-verbs","speaking","conversation","grammar-mixed","review-mixed","spelling"
];

/* ============ STATE (Step 2) ============ */
const DEFAULT = {
  v:3, mode:"standard", sound:true, textSize:1, teacher:false,
  items:{},                       /* id -> {n, first, last, box, due, misses, clearedDays[]} */
  steps:{},                       /* stepId -> {best, stars, done, ts} */
  sections:{},                    /* secId  -> {done, tested} */
  xp:0, streak:{count:0, last:null}, goal:{perDay:1},
  cards:[],                       /* SRS vocabulary cards (kept from v2) */
  lastSessions:[]                 /* [{firstPct, ts}] for suggestion banners */
};
let S = loadState();

function loadState(){
  try{
    const cur = JSON.parse(localStorage.getItem(STORE_KEY));
    if(cur && cur.v === 3) return migrate(Object.assign(JSON.parse(JSON.stringify(DEFAULT)), cur));
    const old = JSON.parse(localStorage.getItem(OLD_KEY));
    if(old) return migrateOld(old);
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT));
}
/* migrate an old v2 save (Step 2): done map -> steps with 1 star; drop hearts/wrong */
function migrateOld(o){
  const n = JSON.parse(JSON.stringify(DEFAULT));
  n.mode = o.mode || "standard";
  n.sound = o.sound !== false;
  n.xp = o.xp || 0;
  n.streak = { count:o.streak || 0, last:o.lastDay || null };
  n.cards = Array.isArray(o.cards) ? o.cards : [];
  if(o.textSize) n.textSize = o.textSize;
  const done = o.done || {};
  const ts = Date.now();
  Object.keys(done).forEach(stepId=>{
    n.steps[stepId] = { best:1, stars:1, done:true, ts };
  });
  const secDone = o.secDone || {};
  Object.keys(secDone).forEach(secId=>{ n.sections[secId] = {done:true, tested:false}; });
  return migrate(n);
}
function migrate(s){
  s.v = 3; s.mode = s.mode || "standard";
  s.items = s.items || {}; s.steps = s.steps || {}; s.sections = s.sections || {};
  s.cards = s.cards || []; s.lastSessions = [];
  s.streak = s.streak && typeof s.streak === "object" ? s.streak : {count:0,last:null};
  s.goal = s.goal && s.goal.perDay ? s.goal : {perDay:1};
  delete s.hearts; delete s.maxHearts; delete s.wrong; delete s.done; delete s.secDone;
  delete s.lastDay; delete s.lastHeartTs; delete s.audioBase;
  return s;
}
let saveTimer = null;
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }catch(e){} }
function saveSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }

/* ============ HELPERS (Step 1) ============ */
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function pickN(arr, n){ return shuffle(arr).slice(0, n); }
/* local date string (Step 1): streak rolls over at Iran local midnight */
function today(){ const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function yesterdayStr(){ const d = new Date(); d.setDate(d.getDate()-1);
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function esc(s){ return String(s==null?"":s).replace(/[&<>\"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function faNum(n){ return String(n).replace(/[0-9]/g, d=>FA_DIGITS[+d]); }
function enNum(n){ return String(n); }
let toastOk = true;
function toast(m){
  if(!toastOk) return;
  const t = document.getElementById("toast");
  const d = document.createElement("div");
  d.textContent = m; t.appendChild(d);
  setTimeout(()=>d.remove(), 1800);
}
function wordKey(t){ return String(t).replace(/[^A-Za-z'\-]/g,"").replace(/^'+|'+$/g,"").toLowerCase(); }

/* longest-first phrase matching (Step 10) */
const GLOSS_KEYS = Object.keys(GLOSSARY).sort((a,b)=> b.length - a.length);
function glossLookup(token){
  const k = wordKey(token);
  if(!k) return null;
  if(GLOSSARY[k]) return {key:k, fa:GLOSSARY[k].fa||GLOSSARY[k], pos:GLOSSARY[k].pos||""};
  return null;
}
function glossPhraseLookup(sentence){
  const low = sentence.toLowerCase();
  for(const k of GLOSS_KEYS){
    if(k.indexOf(" ") > -1 && low.includes(k)) return {key:k, fa:GLOSSARY[k].fa||GLOSSARY[k], pos:GLOSSARY[k].pos||""};
  }
  return null;
}

/* ============ AUDIO (Step 11) ============ */
async function loadAudioManifest(){
  try{
    const r = await fetch("audio/manifest.json");
    if(r.ok) AUDIO_MANIFEST = await r.json();
  }catch(e){}
}
function speak(text, rate){
  if(!S.sound) return;
  if(!text || !("speechSynthesis" in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]*>/g,""));
    u.lang = "en-US";
    u.rate = rate || (S.mode === "guided" ? 0.8 : 0.9);   /* Step 4: Guided slow */
    const v = speechSynthesis.getVoices().find(x=>/en-(US|GB)/i.test(x.lang));
    if(v) u.voice = v;
    speechSynthesis.speak(u);
  }catch(e){}
}
/* US pronunciation recording: sounds/pronunciation/[word]_us.mp3.
   Falls back to browser TTS when no recording exists. */
function playWordAudio(word){
  if(!S.sound) return;
  let fellBack = false;
  const tts = ()=>{ if(!fellBack){ fellBack = true; speak(word); } };
  try{
    const a = new Audio("sounds/pronunciation/" + encodeURIComponent(String(word).replace(/'/g,"")) + "_us.mp3");
    a.playbackRate = S.mode === "guided" ? 0.8 : 1;
    a.onerror = tts;
    a.play().catch(tts);
  }catch(e){ tts(); }
}
function speakId(id, fallbackText){
  if(!S.sound) return;
  const file = AUDIO_MANIFEST[id];
  if(file){
    const a = new Audio(file);
    a.playbackRate = S.mode === "guided" ? 0.8 : 1;
    a.play().catch(()=> speak(fallbackText));
    return;
  }
  speak(fallbackText);
}
/* sound effects via WebAudio (no files needed) */
let audioCtx = null;
function tone(freq, dur, gain){
  if(!S.sound) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(gain||0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }catch(e){}
}
/* ---- recorded sound effects: sounds/fx/{correct|wrong|click|levelup}_N.mp3.
   A random variant plays each time; falls back to the WebAudio tones above
   if a file is missing. ---- */
const FX_POOL = { correct:5, wrong:5, click:5, levelup:5 };
function playFx(cat, fb){
  if(!S.sound) return;
  try{
    const n = FX_POOL[cat] || 0;
    if(!n){ if(fb) fb(); return; }
    const idx = 1 + Math.floor(Math.random()*n);
    const a = new Audio("sounds/fx/" + cat + "_" + idx + ".mp3");
    a.volume = cat === "click" ? 0.45 : 0.9;
    let fell = false;
    const fall = ()=>{ if(!fell){ fell = true; if(fb) fb(); } };
    a.onerror = fall;
    a.play().catch(fall);
  }catch(e){ if(fb) fb(); }
}
function sfxOk(){ playFx("correct", ()=>{ tone(660,.1,.12); setTimeout(()=>tone(880,.16,.12),90); }); }
function sfxNo(){ playFx("wrong", ()=> tone(220,.18,.1)); }
/* subtle tick on UI buttons (answer options and audio buttons have their own sounds) */
document.addEventListener("click", e=>{
  const b = e.target.closest("button");
  if(!b || b.closest("#opts") || b.classList.contains("audiobtn")) return;
  playFx("click");
});

/* ============ RECORD() — the ONLY writer of items (Step 2) ============ */
function record(itemId, firstTryCorrect){
  const rec = S.items[itemId] || { n:0, first:0, last:null, box:0, due:null, misses:0, clearedDays:[] };
  rec.n++;
  rec.last = today();
  if(!rec.first) rec.first = firstTryCorrect ? 1 : 0;
  if(!firstTryCorrect) rec.misses++;
  if(firstTryCorrect){
    rec.box = Math.min(5, rec.box + 1);
    const days = [0,0,1,3,7,14][rec.box];
    rec.due = days ? addDays(today(), days) : null;
    if(rec.misses > 0 && !rec.clearedDays.includes(today())) rec.clearedDays.push(today());
  }
  S.items[itemId] = rec;
  saveSoon();
}
function addDays(dateStr, n){
  const [y,m,d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m-1, d + n);
  return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
}
/* an item is in the mistake queue until 2 first-try corrects on different days */
function inQueue(rec){ return rec && rec.misses > 0 && (rec.clearedDays||[]).length < 2; }
function queueItems(){
  return Object.keys(S.items).filter(id => inQueue(S.items[id]));
}

/* ============ STREAK (Step 1: local midnight) ============ */
function touchStreak(){
  const t = today();
  if(S.streak.last === t) return;
  S.streak.count = (S.streak.last === yesterdayStr()) ? S.streak.count + 1 : 1;
  S.streak.last = t;
  saveSoon();
}

/* ============ ADD XP ============ */
function addXP(n){ if(n>0){ S.xp += n; saveSoon(); } }

/* ============ FEEDBACK SHEET (Step 3) ============ */
const $fbSheet = document.getElementById("fbSheet");
const $fbMsg = document.getElementById("fbMsg");
const $fbEx = document.getElementById("fbEx");
const $fbBtn = document.getElementById("fbBtn");
const $fbIcon = document.getElementById("fbIcon");
let fbResolve = null, fbToken = 0;
/* states: "ok" | "retry" (wrong, answer hidden) | "reveal" (wrong, answer shown) */
function feedback(kind, exFa, btnLabel, onContinue, revealText){
  fbToken++;
  const token = fbToken;
  const live = document.activeElement;
  $fbSheet.classList.remove("ok","no","show");
  $fbSheet.classList.add(kind === "ok" ? "ok" : "no", "show");
  $fbIcon.textContent = kind === "ok" ? "\u2713" : "\u2717";
  $fbMsg.textContent = kind === "ok" ? "درست!" : "نادرست";
  let ex = exFa || "";
  if(kind === "reveal" && revealText){
    ex = '<span class="markline">پاسخ درست: <span class="opt-reveal">' + esc(revealText) + '</span></span>' + (ex ? esc(ex) : "");
    $fbEx.innerHTML = ex;
  } else {
    $fbEx.textContent = ex;
  }
  $fbBtn.textContent = btnLabel || "ادامه";
  if(kind === "ok") sfxOk(); else sfxNo();
  $fbBtn.onclick = ()=>{
    if(token !== fbToken) return;
    $fbSheet.classList.remove("show");
    fbResolve = null;
    const t = fbToken;
    setTimeout(()=>{ if(t === fbToken && onContinue) onContinue(); if(live && live.focus) try{live.focus();}catch(e){} }, 120);
  };
  $fbBtn.focus();
}
function closeFeedback(){ fbToken++; $fbSheet.classList.remove("show"); }

/* ============ CONFIRM DIALOG (Step 1: no window.confirm) ============ */
const $dlg = document.getElementById("dlg");
let dlgFocusReturn = null;
function confirmDlg(title, body, yesLabel, noLabel, onYes){
  dlgFocusReturn = document.activeElement;
  document.getElementById("dlgTitle").textContent = title;
  document.getElementById("dlgBody").textContent = body;
  document.getElementById("dlgYes").textContent = yesLabel || "بله";
  document.getElementById("dlgNo").textContent = noLabel || "انصراف";
  $dlg.classList.add("show");
  document.getElementById("dlgYes").focus();
  document.getElementById("dlgYes").onclick = ()=>{ $dlg.classList.remove("show"); if(onYes) onYes(); refocus(); };
  document.getElementById("dlgNo").onclick = ()=>{ $dlg.classList.remove("show"); refocus(); };
  $dlg.onclick = e=>{ if(e.target === $dlg){ $dlg.classList.remove("show"); refocus(); } };
  function refocus(){ if(dlgFocusReturn && dlgFocusReturn.focus) try{dlgFocusReturn.focus();}catch(e){} }
}
/* simple focus trap for open dialogs (Step 12) */
document.addEventListener("keydown", e=>{
  if(e.key === "Escape"){
    if($dlg.classList.contains("show")){ $dlg.classList.remove("show"); return; }
    if(document.getElementById("overlay").classList.contains("show")) closeSheet();
    return;
  }
  const openDlg = $dlg.classList.contains("show") ? $dlg : null;
  if(!openDlg) return;
  if(e.key === "Tab"){
    const els = [...openDlg.querySelectorAll("button")].filter(b=>!b.disabled);
    if(!els.length) return;
    const first = els[0], last = els[els.length-1];
    if(e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
  }
});

/* ============ WORD / SENTENCE POPUP (Step 10 glossary) ============ */
const $overlay = document.getElementById("overlay");
function closeSheet(){ $overlay.classList.remove("show"); }
$overlay.addEventListener("click", e=>{ if(e.target === $overlay) closeSheet(); });
document.getElementById("sheetClose").onclick = closeSheet;
function openSheet(html){
  document.getElementById("sheetBody").innerHTML = html;
  $overlay.classList.add("show");
}
function wordPopup(w){
  const g = glossLookup(w);
  const fa = g ? g.fa : null;
  const pos = g && g.pos ? " («" + g.pos + "»)" : "";
  const has = S.cards.some(c=>c.w === w);
  openSheet(
    '<h3 class="ltr" style="text-align:center;font-size:26px">' + esc(w) + "</h3>" +
    '<p style="text-align:center;font-size:20px;font-weight:700;color:var(--ink)">' +
      (fa ? esc(fa) + esc(pos) : "— هنوز در واژه‌نامه ثبت نشده —") + "</p>" +
    '<div class="row" style="margin-top:14px">' +
      '<button class="btn sec sm" style="flex:1" id="spkWord">تلفظ</button>' +
      '<button class="btn sm" style="flex:1" id="addCard" ' + (has?"disabled":"") + ">" +
        (has ? "\u2713 در کارت‌ها" : "افزودن به کارت‌ها") + "</button></div>");
  document.getElementById("spkWord").onclick = ()=> playWordAudio(w);
  playWordAudio(w); /* auto-play on tap */
  const b = document.getElementById("addCard");
  if(b && !has) b.onclick = ()=>{
    S.cards.push({w, fa:fa||"", pos:pos||"", box:0, due:Date.now(), lapses:0});
    saveSoon(); addXP(1);
    b.textContent = "\u2713 در کارت‌ها"; b.disabled = true;
    document.querySelectorAll('.w[data-w="'+cssEscape(w)+'"]').forEach(e=>e.classList.add("seen"));
  };
}
function sentencePopup(el){
  const fa = el.dataset.fa, en = el.textContent;
  openSheet(
    '<p class="ltr" style="font-size:17px;font-weight:600;line-height:2">' + esc(en) + "</p>" +
    '<hr style="border:none;border-top:1px dashed var(--ctl);margin:12px 0">' +
    '<p style="font-size:16px;font-weight:700;color:var(--ink);line-height:2">' + esc(fa || "— ترجمه ثبت نشده —") + "</p>" +
    '<button class="btn sm" style="width:100%;margin-top:10px" id="spkSent">پخش جمله</button>');
  document.getElementById("spkSent").onclick = ()=> speak(en);
}
function cssEscape(s){ if(window.CSS && CSS.escape) return CSS.escape(s); return String(s).replace(/[^a-zA-Z0-9_\-]/g, ch=>"\\"+ch); }

/* tap-to-see words (Step 6 grammar discovery uses the same markup).
   Glossary is phrase-level and matched longest-first (Step 10). */
function tap(sentence, fa){
  const clean = String(sentence).replace(/<[^>]*>/g, "");
  const toks = clean.split(/(\s+)/);
  /* find the longest glossary phrase present, so "light bulb" wins over "light" */
  const phrase = glossPhraseLookup(clean);
  const phraseToks = phrase ? new Set(phrase.key.split(/\s+/)) : null;
  let phraseUsed = false;
  const inner = toks.map(t=>{
    if(/^\s+$/.test(t)) return t;
    const key = wordKey(t);
    const label = esc(t);
    if(!key) return label;
    let dataW = key;
    if(phrase && !phraseUsed && phraseToks.has(key.toLowerCase())){
      dataW = phrase.key; phraseUsed = true;
    }
    const seen = S.cards.some(c=>c.w === dataW) ? " seen" : "";
    return '<span class="w'+seen+'" data-w="'+esc(dataW)+'" lang="en" dir="ltr">'+label+"</span>";
  }).join("");
  return '<span class="sent ltr" dir="ltr" data-fa="'+esc(fa||"")+'">'+inner+"</span>";
}
let clickTimer = null;
document.addEventListener("click", e=>{
  if(e.target.closest("#sheet") || e.target.closest("#fbSheet") || e.target.closest("#dlg")) return;
  const w = e.target.closest(".w");
  if(w){
    if(clickTimer){ clearTimeout(clickTimer); clickTimer = null; return; }
    clickTimer = setTimeout(()=>{ clickTimer = null; wordPopup(w.dataset.w); }, 230);
  }
});
document.addEventListener("dblclick", e=>{
  if(e.target.closest("#sheet") || e.target.closest("#fbSheet")) return;
  const s = e.target.closest(".sent");
  if(s){ if(clickTimer){ clearTimeout(clickTimer); clickTimer = null; } sentencePopup(s); }
});
let lastTap = 0, lastTapTarget = null;
document.addEventListener("touchend", e=>{
  if(e.target.closest("#sheet") || e.target.closest("#fbSheet")) return;
  const s = e.target.closest(".sent"); if(!s) return;
  const now = Date.now();
  if(now - lastTap < 320 && lastTapTarget === s){
    if(clickTimer){ clearTimeout(clickTimer); clickTimer = null; }
    sentencePopup(s); lastTap = 0; lastTapTarget = null; e.preventDefault();
  } else { lastTap = now; lastTapTarget = s; }
}, {passive:false});

/* ============ ROUTER (Step 8) ============ */
const state = { lesson:null, section:null, stepIdx:0, steps:[], mode:null, round:null };
let stepCleanup = null, renderToken = 0;
const $app = document.getElementById("app");
const $ltop = document.getElementById("ltop");
const $ltBar = document.getElementById("ltBar");
const $ltBarWrap = document.getElementById("ltBarWrap");
function go(view, params){
  renderToken++;
  if(stepCleanup){ try{ stepCleanup(); }catch(e){} stepCleanup = null; }
  window.scrollTo({top:0, behavior:"instant"});
  const inLesson = (view === "step" || view === "done");
  $ltop.style.display = inLesson ? "flex" : "none";
  document.getElementById("bottomNav").classList.toggle("hidden", inLesson);
  if(view === "home") renderHome();
  else if(view === "cards") renderCards();
  else if(view === "review") renderReview();
  else if(view === "stats") renderStats();
  else if(view === "section") renderSection(params.sectionId);
  else if(view === "step") renderStep();
  else if(view === "done") renderDone(params.sectionId);
  else if(view === "firstrun") renderFirstRun(params.page);
}
document.querySelectorAll("nav.bottom button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll("nav.bottom button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");
    go(b.dataset.nav);
  };
});
function setProgress(frac){
  $ltBar.style.width = Math.round(frac*100) + "%";
  $ltBarWrap.setAttribute("aria-valuenow", String(Math.round(frac*100)));
}

/* ============================================================
   ITEM RUNNER (Steps 3 + 4) — one place where every graded item
   is asked, checked, recorded and fed back. Modes only change
   presentation; every mode covers every item (Step 0 decision 4).
   ============================================================ */
const MODES = {
  guided:    { fa:"راهنمایی‌شده", opts:2, attempts:2, hint:"always",  qFa:"always", round:5, transcript:"always" },
  standard:  { fa:"استاندارد",    opts:3, attempts:2, hint:"after1",  qFa:"tap",    round:6, transcript:"after"  },
  challenge: { fa:"چالشی",        opts:4, attempts:1, hint:"never",   qFa:"after",  round:8, transcript:"after"  }
};
function modeCfg(){ return MODES[S.mode] || MODES.standard; }

function buildOptions(it){
  const answer = it.opts[it.ans];
  const cfg = modeCfg();
  let pool = it.opts.filter((_, i)=> i !== it.ans);
  pool = shuffle(pool);
  let chosen = [answer];
  for(const p of pool){
    if(chosen.length >= cfg.opts) break;
    if(!chosen.includes(p)) chosen.push(p);
  }
  return shuffle(chosen);
}
/* typed normalization: case, spaces, quotes, ی/ي (Step 7) */
function normType(v){
  return String(v||"").toLowerCase().replace(/[\u064A]/g,"\u06CC").replace(/[\u0643]/g,"ک")
    .replace(/[\u2018\u2019\u201C\u201D'"]/g,"")
    .replace(/\s+/g," ").trim();
}
function checkTyped(it, val){
  if(!it.typed || !it.typed.accept) return null;
  const v = normType(val);
  if(!v) return null;
  for(const a of it.typed.accept){
    if(normType(a) === v) return true;
  }
  /* near-miss: same letters, different spacing/ending hint (Step 7) */
  for(const a of it.typed.accept){
    const na = normType(a);
    if(na.replace(/\s/g,"") === v.replace(/\s/g,"")) return "near";
    if(na.length > 2 && (na.startsWith(v) || v.startsWith(na)) ) return "near";
  }
  return false;
}

/* render one item into el; call done({firstTry}) when finished */
function renderItem(it, el, done){
  const cfg = modeCfg();
  const type = it.type || "choice";
  const R = {
    choice:rChoice, listen_choice:rListenChoice, transform:rTransform,
    inline_choice:rInline, error_spot:rErrorSpot, tap_words:rTapWords,
    match:rMatchItem, dialogue:rDialogue, listen_type:rListenType, stress:rStress
  }[type] || rChoice;
  const ctx = {
    it, el, cfg, done,
    firstTry:true, wrongTries:0, finished:false,
    id: it.id
  };
  R(ctx);
}

/* shared finish for every item type (Step 3 flow, single implementation) */
function itemResult(ctx, ok, opts){
  opts = opts || {};
  if(ctx.finished) return;
  ctx.finished = true;
  const first = ctx.firstTry;
  record(ctx.id, first && ok ? true : false);
  if(ok && first) addXP(10);
  else if(ok) addXP(5);
  const label = opts.nextLabel || "ادامه";
  if(ok){
    feedback("ok", opts.exFa || ctx.it.exFa, label, ()=> ctx.done({firstTry:first}));
  } else {
    if(opts.revealText !== undefined){
      feedback("reveal", opts.exFa || ctx.it.exFa, "ادامه", ()=> ctx.done({firstTry:first}), opts.revealText);
    } else {
      feedback("no", opts.exFa || ctx.it.exFa, "دوباره امتحان کن", ()=>{
        ctx.firstTry = false; ctx.finished = false; ctx.wrongTries++;
        if(opts.onRetry) opts.onRetry();
      });
    }
  }
}
/* mark option buttons ok/no/disabled consistently */
function paintOpts(box, correctIdx, wrongIdx){
  [...box.children].forEach((c, k)=>{
    c.classList.add("dis");
    if(k === correctIdx) c.classList.add("ok");
    else if(k === wrongIdx) c.classList.add("no");
  });
}
function optionBtn(o, pos, onClick){
  const b = document.createElement("button");
  b.className = "opt";
  b.type = "button";
  b.setAttribute("role","radio");
  b.innerHTML = '<span class="key" aria-hidden="true">'+(pos+1)+'</span><span class="ltr" dir="ltr" lang="en">'+esc(o)+"</span>";
  b.onclick = onClick;
  return b;
}
/* persian question text under the question (Step 4 per mode) */
function qFaBlock(it){
  const cfg = modeCfg();
  if(cfg.qFa === "always") return '<p class="q-fa">'+esc(it.qFa||"")+"</p>";
  if(cfg.qFa === "tap" && it.qFa)
    return '<button class="btn sec sm" id="qFaBtn" style="margin:6px 0">ترجمه</button><p class="q-fa" id="qFaBox" style="display:none">'+esc(it.qFa)+"</p>";
  if(cfg.qFa === "after")
    return '<p class="q-fa" id="qFaBox" style="display:none">'+esc(it.qFa||"")+"</p>";
  return "";
}
function wireQFa(el){
  const b = el.querySelector("#qFaBtn");
  if(b) b.onclick = ()=>{ const x = el.querySelector("#qFaBox"); if(x) x.style.display = "block"; b.remove(); };
}
function showQFa(el){ const x = el.querySelector("#qFaBox"); if(x) x.style.display = "block"; }
function hintBlock(ctx, forced){
  const cfg = modeCfg();
  const show = forced || cfg.hint === "always";
  if(!ctx.it.hintFa) return "";
  if(show) return '<div class="hintbox"><span class="hlabel">راهنما: </span>'+esc(ctx.it.hintFa)+"</div>";
  if(cfg.hint === "after1")
    return '<div class="hintbox" id="hintBox" style="display:none"><span class="hlabel">راهنما: </span>'+esc(ctx.it.hintFa)+"</div>";
  return "";
}
function showHint(el){ const h = el.querySelector("#hintBox"); if(h) h.style.display = "block"; }

/* ---- choice (also serves any opts/ans item) ---- */
function rChoice(ctx){
  const {it, el, cfg} = ctx;
  const options = buildOptions(it);
  const correctIdx = options.indexOf(it.opts[it.ans]);
  el.innerHTML =
    '<p class="q ltr" dir="ltr" lang="en">'+esc(it.q)+"</p>" +
    qFaBlock(it) + hintBlock(ctx) +
    '<div class="opts" role="radiogroup" aria-label="گزینه‌ها" id="opts"></div>' +
    (cfg.opts === 4 && it.typed ? typedRow() : "");
  const box = el.querySelector("#opts");
  wireQFa(el);
  options.forEach((o, pos)=> box.appendChild(optionBtn(o, pos, ()=>answer(pos))));
  function answer(pos){
    if(ctx.finished) return;
    const ok = pos === correctIdx;
    if(ok){
      paintOpts(box, correctIdx, ctx.wrongTries > 0 ? ctx.lastWrong : -1);
      itemResult(ctx, true, { nextLabel: nextLabelFor(it) });
    } else {
      ctx.lastWrong = pos;
      box.children[pos].classList.add("no","dis");
      if(cfg.attempts === 1 || ctx.wrongTries + 1 >= cfg.attempts){
        paintOpts(box, correctIdx, pos);
        showQFa(el); showHint(el);
        itemResult(ctx, false, { revealText: it.opts[it.ans], exFa: it.exFa, nextLabel: "ادامه" });
      } else {
        showHint(el);
        itemResult(ctx, false, { exFa: it.exFa });
      }
    }
  }
}
function typedRow(){
  return '<div id="typedRow" style="margin-top:12px"><label class="sr" for="typedIn">پاسخ تایپی</label>' +
    '<input class="typeline" id="typedIn" type="text" autocomplete="off" spellcheck="false" placeholder="Type your answer…">' +
    '<button class="btn" id="typedChk" style="margin-top:8px" disabled>بررسی</button></div>';
}
function wireTyped(ctx, box, onCheck){
  const inp = box.querySelector("#typedIn"), chk = box.querySelector("#typedChk");
  if(!inp) return;
  inp.addEventListener("input", ()=>{ chk.disabled = !inp.value.trim(); });
  inp.addEventListener("keydown", e=>{ if(e.key === "Enter" && !chk.disabled) chk.click(); });
  chk.onclick = ()=> onCheck(inp.value);
}
function nextLabelFor(it){
  return (it.type === "listen_choice" || it.type === "listen_type") ? "بعدی" : "ادامه";
}

/* number keys 1-4 choose options (Step 12) */
document.addEventListener("keydown", e=>{
  if(overlayOpen()) return;
  const grp = document.querySelector('#stage .opts[radiogroup], #stage .opts[role="radiogroup"]');
  if(!grp) return;
  const n = parseInt(e.key, 10);
  if(n >= 1 && n <= 4 && grp.children[n-1] && !grp.children[n-1].classList.contains("dis")){
    grp.children[n-1].click();
  }
});
function overlayOpen(){
  return document.getElementById("overlay").classList.contains("show") ||
         $fbSheet.classList.contains("show") || $dlg.classList.contains("show");
}

/* ---- audio button (44px inline, Step 9/11; nothing autoplays) ---- */
function audioBtn(text, id){
  return '<button class="audiobtn" aria-label="پخش صدا" data-say="'+esc(text||"")+'"'+
    (id?' data-say-id="'+esc(id)+'"':'')+'>'+
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5"/><path d="M8 6.5v11"/><path d="M12 4v16"/><path d="M16 7.5v9"/><path d="M20 10v4"/></svg></button>';
}
document.addEventListener("click", e=>{
  const b = e.target.closest(".audiobtn");
  if(!b) return;
  e.stopPropagation();
  b.classList.add("playing");
  const done = ()=> b.classList.remove("playing");
  if(b.dataset.sayId){ speakId(b.dataset.sayId, b.dataset.say); setTimeout(done, 2200); }
  else { speak(b.dataset.say); setTimeout(done, 2200); }
});

/* ---- listen_choice (Step 7): transcript hidden until answered (except Guided) ---- */
function rListenChoice(ctx){
  const {it, el, cfg} = ctx;
  const showTranscript = cfg.transcript === "always";
  el.innerHTML =
    '<p class="instr">به صدا گوش بده، بعد جواب بده.</p>' +
    '<div style="text-align:center;margin:10px 0">'+audioBtn(it.lines.map(l=>l.t).join(" "), it.audioId)+"</div>" +
    (showTranscript ? transcriptBlock(it) : "") +
    '<p class="q ltr" dir="ltr" lang="en">'+esc(it.q)+"</p>" +
    qFaBlock(it) + hintBlock(ctx) +
    '<div class="opts" role="radiogroup" id="opts"></div>' +
    (showTranscript ? "" : '<button class="btn sec sm" id="showTr" style="margin-top:8px">نمایش متن (بعد از پاسخ)</button>');
  const box = el.querySelector("#opts");
  wireQFa(el);
  const options = buildOptions(it);
  const correctIdx = options.indexOf(it.opts[it.ans]);
  options.forEach((o, pos)=> box.appendChild(optionBtn(o, pos, ()=>answer(pos))));
  const trBtn = el.querySelector("#showTr");
  if(trBtn) trBtn.onclick = ()=>{ if(ctx.finished) trBtn.replaceWith(htmlEl(transcriptBlock(it))); };
  function answer(pos){
    if(ctx.finished) return;
    const ok = pos === correctIdx;
    if(ok){ paintOpts(box, correctIdx, ctx.lastWrong != null ? ctx.lastWrong : -1); itemResult(ctx, true, {}); }
    else {
      ctx.lastWrong = pos;
      box.children[pos].classList.add("no","dis");
      if(cfg.attempts === 1 || ctx.wrongTries + 1 >= cfg.attempts){
        paintOpts(box, correctIdx, pos); showQFa(el); showHint(el);
        itemResult(ctx, false, { revealText: it.opts[it.ans] });
      } else { showHint(el); itemResult(ctx, false, {}); }
    }
  }
}
function transcriptBlock(it){
  return '<div class="sentblock" style="margin-top:8px">' +
    it.lines.map(l=>'<p style="margin:4px 0"><span class="ltr" dir="ltr" lang="en">'+esc(l.t)+"</span></p>").join("") + "</div>";
}
function htmlEl(html){ const d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; }

/* ---- transform: tile sentences (Step 7) ---- */
function rTransform(ctx){
  const {it, el, cfg} = ctx;
  let built = [];
  const tiles = shuffle(it.tiles);
  el.innerHTML =
    '<p class="instr">'+esc(it.promptFa||"کلمه‌ها را به ترتیب درست بچین.")+"</p>" +
    (it.from ? '<p class="muted ltr" dir="ltr" lang="en" style="margin-top:0">'+esc(it.from)+"</p>" : "") +
    (it.qFa ? '<p class="q-fa">'+esc(it.qFa)+"</p>" : "") +
    hintBlock(ctx) +
    '<div class="builtline" id="built" aria-label="جملهٔ ساخته‌شده"></div>' +
    '<div class="chips" id="pool"></div>' +
    '<div class="row" style="margin-top:8px"><button class="btn sec sm" id="undo" style="flex:1">حذف آخرین</button>' +
    '<button class="btn sm" id="check" style="flex:1" disabled>بررسی</button></div>';
  const pool = el.querySelector("#pool"), builtBox = el.querySelector("#built"),
        chk = el.querySelector("#check"), undo = el.querySelector("#undo");
  wireQFa(el);
  tiles.forEach((w, k)=>{
    const c = document.createElement("button");
    c.className = "chip"; c.type = "button"; c.textContent = w;
    c.onclick = ()=>{ if(c.classList.contains("used") || ctx.finished) return;
      built.push({w, chip:c}); c.classList.add("used"); paint(); };
    pool.appendChild(c);
  });
  function paint(){
    builtBox.innerHTML = built.map((x,k)=>'<span class="chip picked" data-k="'+k+'">'+esc(x.w)+"</span>").join("");
    builtBox.querySelectorAll("[data-k]").forEach(x=>{
      x.onclick = ()=>{ const k = +x.dataset.k; if(!built[k]) return;
        built[k].chip.classList.remove("used"); built.splice(k,1); paint(); };
    });
    chk.disabled = built.length !== it.tiles.length;
  }
  undo.onclick = ()=>{ const last = built.pop(); if(last){ last.chip.classList.remove("used"); paint(); } };
  chk.onclick = ()=>{
    const attempt = built.map(x=>x.w).join(" ").replace(/\s+/g," ").trim();
    const target = it.ans.replace(/\s+/g," ").trim();
    const norm = s=>normType(s);
    if(norm(attempt) === norm(target)){
      builtBox.classList.add("ok");
      itemResult(ctx, true, {});
    } else if(ctx.cfg.attempts === 1 || ctx.wrongTries + 1 >= ctx.cfg.attempts){
      showHint(el);
      itemResult(ctx, false, { revealText: target, exFa: it.exFa });
    } else {
      showHint(el);
      itemResult(ctx, false, {});
    }
  };
}

/* ---- inline choice: paragraph with slots (Step 7) ---- */
function rInline(ctx){
  const {it, el, cfg} = ctx;
  el.innerHTML =
    '<p class="instr">'+esc(it.introFa||"در هر جای خالی شکل درست را انتخاب کن.")+"</p>" +
    hintBlock(ctx) +
    '<div class="inlinepara">' +
      it.parts.map((p, i)=> esc(p) +
        (i < it.parts.length-1 ? '<span class="gap" data-g="'+i+'">＿＿＿</span>' : "")
      ).join("") + "</div>" +
    '<div id="slotArea"></div>' +
    '<button class="btn" id="check" style="margin-top:10px" disabled>بررسی</button>';
  const picked = it.slots.map(()=>null);
  const slotArea = el.querySelector("#slotArea");
  const chk = el.querySelector("#check");
  wireQFa(el);
  el.querySelectorAll(".gap").forEach(g=>{
    g.onclick = ()=>{
      if(ctx.finished) return;
      const i = +g.dataset.g;
      const slot = it.slots[i];
      const opts = modeCfg().opts === 2 ? slot.opts.filter((_,k)=>k===slot.ans).concat(slot.opts.filter((_,k)=>k!==slot.ans).slice(0,1))
                                        : slot.opts;
      const order = shuffle(opts);
      slotArea.innerHTML = '<p class="progress-label">جای خالی '+(i+1)+"</p>" +
        '<div class="slotpop" role="radiogroup">' +
        order.map((o,k)=>'<button class="chip" data-o="'+esc(o)+'">'+esc(o)+"</button>").join("") + "</div>";
      slotArea.querySelectorAll(".chip").forEach(c=>{
        c.onclick = ()=>{
          picked[i] = c.dataset.o;
          g.textContent = c.dataset.o;
          g.classList.add("filled");
          slotArea.innerHTML = "";
          chk.disabled = !picked.every(v=>v != null);
        };
      });
    };
  });
  chk.onclick = ()=>{
    const allOk = it.slots.every((s,i)=> picked[i] === s.opts[s.ans]);
    el.querySelectorAll(".gap").forEach((g,i)=>{
      g.classList.remove("filled"); g.classList.add(allOk ? "ok" : "no");
    });
    if(allOk){ itemResult(ctx, true, {}); }
    else if(cfg.attempts === 1 || ctx.wrongTries + 1 >= cfg.attempts){
      showHint(el);
      const reveal = it.slots.map(s=>s.opts[s.ans]).join(" · ");
      itemResult(ctx, false, { revealText: reveal });
    } else {
      showHint(el);
      itemResult(ctx, false, {});
    }
  };
}

/* ---- error spotting: tap mistake, pick fix (Step 7) ---- */
function rErrorSpot(ctx){
  const {it, el, cfg} = ctx;
  const toks = it.sentence.split(/(\s+)/);
  el.innerHTML =
    '<p class="instr">'+esc(it.qFa||"کلمهٔ اشتباه را پیدا کن و بزن.")+"</p>" +
    hintBlock(ctx) +
    '<div class="inlinepara" id="words">' +
      toks.map(t=> /^\s+$/.test(t) ? t :
        '<span class="w" lang="en" dir="ltr" data-t="'+esc(t)+'">'+esc(t)+"</span>").join("") +
    "</div>" +
    '<div id="fixArea"></div>';
  const words = el.querySelector("#words"), fixArea = el.querySelector("#fixArea");
  wireQFa(el);
  words.querySelectorAll(".w").forEach(sp=>{
    sp.onclick = ()=>{
      if(ctx.finished) return;
      const isWrong = wordKey(sp.dataset.t) === wordKey(it.wrong);
      if(isWrong){
        sp.classList.add("picked");
        const fixes = cfg.opts === 2 ? it.fixOpts.slice(0,2) : it.fixOpts;
        const order = shuffle(fixes);
        fixArea.innerHTML = '<p class="progress-label">شکل درست را انتخاب کن:</p><div class="slotpop" role="radiogroup">' +
          order.map(o=>'<button class="chip" data-f="'+esc(o)+'">'+esc(o)+"</button>").join("") + "</div>";
        fixArea.querySelectorAll(".chip").forEach(c=>{
          c.onclick = ()=>{
            if(ctx.finished) return;
            const ok = c.dataset.f === it.fixOpts[it.fixAns];
            if(ok){ sp.classList.add("tgt"); itemResult(ctx, true, {}); }
            else if(cfg.attempts === 1 || ctx.wrongTries+1 >= cfg.attempts){
              showHint(el); sp.classList.add("tgt");
              itemResult(ctx, false, { revealText: it.wrong + " → " + it.fixOpts[it.fixAns] });
            } else { showHint(el); itemResult(ctx, false, {}); }
          };
        });
      } else {
        sp.classList.add("no");
        setTimeout(()=>sp.classList.remove("no"), 500);
        showHint(el);
      }
    };
  });
}

/* ---- tap words (Step 7): tap targets; missed targets shown at the end ---- */
function rTapWords(ctx){
  const {it, el} = ctx;
  const sentences = Object.keys(it.targets);
  let si = 0;
  function draw(){
    const sentence = sentences[si];
    const targets = it.targets[sentence];
    const toks = sentence.split(/(\s+)/);
    el.innerHTML =
      '<p class="instr">'+esc(it.introFa||"روی کلمه‌های خواسته‌شده بزن.")+"</p>" +
      hintBlock(ctx) +
      '<div class="inlinepara" id="words">' +
        toks.map(t=> /^\s+$/.test(t) ? esc(t) :
          '<span class="w" lang="en" dir="ltr" data-t="'+esc(t)+'">'+esc(t)+"</span>").join("") +
      "</div>" +
      '<p class="progress-label" id="twState"></p>';
    const words = el.querySelector("#words"), st = el.querySelector("#twState");
    wireQFa(el);
    const hit = new Set();
    words.querySelectorAll(".w").forEach(sp=>{
      sp.onclick = ()=>{
        if(ctx.finished) return;
        const t = sp.dataset.t.toLowerCase().replace(/[^a-z':]/g,"");
        const found = targets.some(tg=>{
          const parts = tg.toLowerCase().split(/\s+/);
          if(parts.length === 1) return t === parts[0].replace(/[^a-z':]/g,"");
          return false;
        }) && !hit.has(sp);
        if(found){ hit.add(sp); sp.classList.add("tgt"); st.textContent = "+1"; }
        else { sp.classList.add("missed"); setTimeout(()=>sp.classList.remove("missed"), 600); }
      };
    });
    const foot = document.createElement("div");
  foot.innerHTML = '<button class="btn" id="twDone" style="margin-top:10px">بررسی</button>';
  el.appendChild(foot);
  const twDoneBtn = foot.querySelector("#twDone");
  twDoneBtn && (twDoneBtn.onclick = ()=>{
      if(ctx.finished) return;
      /* multi-word targets: highlight spans that joined hit the phrase */
      const missed = [];
      targets.forEach(tg=>{
        const parts = tg.split(/\s+/);
        if(parts.length === 1){
          const sp = [...words.querySelectorAll(".w")].find(x=>
            wordKey(x.dataset.t) === wordKey(tg) && !x.classList.contains("tgt"));
          if(sp){ sp.classList.add("missed"); missed.push(tg); }
        } else {
          const spans = [...words.querySelectorAll(".w")];
          for(let k=0;k<=spans.length-parts.length;k++){
            const seg = spans.slice(k,k+parts.length);
            if(seg.map(s=>wordKey(s.dataset.t)).join(" ") === wordKey(tg).replace(/-/g," ")){
              if(seg.every(s=>s.classList.contains("tgt"))){
                /* mark all as one highlight */
              } else if(seg.some(s=>s.classList.contains("tgt"))){
                /* partial */
              } else { seg.forEach(s=>s.classList.add("missed")); missed.push(tg); }
              break;
            }
          }
        }
      });
      const ok = missed.length === 0;
      if(ok){ itemResult(ctx, true, {}); }
      else if(ctx.cfg.attempts === 1 || ctx.wrongTries+1 >= ctx.cfg.attempts){
        showHint(el);
        itemResult(ctx, false, { revealText: targets.join(", ") });
      } else {
        showHint(el);
        itemResult(ctx, false, { exFa: it.exFa + " (کلمه‌های باقی‌مانده را پیدا کن)" });
      }
    });
  }
  draw();
}

/* ---- match item (subject -> pronoun inside the runner) ---- */
function rMatchItem(ctx){
  const {it, el, cfg} = ctx;
  const right = it.right.map(x=>({...x}));
  el.innerHTML =
    '<p class="instr">'+esc(it.tipFa||"روی یک مورد از ستون راست بزن، بعد جفتش را در چپ انتخاب کن.")+"</p>" +
    hintBlock(ctx) +
    '<div class="mgrid"><div class="mcol" id="cL"></div><div class="mcol" id="cR"></div></div>';
  const cL = el.querySelector("#cL"), cR = el.querySelector("#cR");
  wireQFa(el);
  let selL = null, matched = 0, errs = 0;
  it.left.forEach(x=>{
    const d = document.createElement("button");
    d.className = "mitem"; d.type = "button";
    d.innerHTML = '<span class="ltr" dir="ltr" lang="en">'+esc(x.txt)+"</span>";
    d.dataset.id = String(x.txt);
    d.onclick = ()=>{ if(d.classList.contains("ok")) return;
      cL.querySelectorAll(".mitem").forEach(e=>e.classList.remove("sel"));
      d.classList.add("sel"); selL = d; };
    cL.appendChild(d);
  });
  shuffle(right).forEach(x=>{
    const d = document.createElement("button");
    d.className = "mitem"; d.type = "button";
    d.innerHTML = '<span dir="rtl">'+esc(x.t)+"</span>";
    d.dataset.m = String(x.m);
    d.onclick = ()=> pickR(d);
    cR.appendChild(d);
  });
  function pickR(d){
    if(ctx.finished || d.classList.contains("ok") || !selL) return;
    const m = +d.dataset.m;
    const ltxt = selL.dataset.id;
    const want = m >= 0 ? it.left[m].txt : null;
    if(want === ltxt){
      selL.classList.remove("sel"); selL.classList.add("ok"); d.classList.add("ok");
      selL = null; matched++;
      if(matched === it.left.length) itemResult(ctx, true, {});
    } else {
      errs++;
      d.classList.add("no"); setTimeout(()=>d.classList.remove("no"), 450);
      selL.classList.remove("sel"); selL = null;
      if(cfg.attempts === 1 || errs >= cfg.attempts){
        showHint(el);
        itemResult(ctx, false, { revealText: "جفت‌های درست مشخص شدند" });
        cR.querySelectorAll(".mitem").forEach(r=>{
          const m2 = +r.dataset.m;
          if(m2 >= 0){
            const L = cL.querySelectorAll(".mitem")[m2];
            if(L){ L.classList.add("ok"); r.classList.add("ok"); }
          }
        });
      }
    }
  }
}

/* ---- dialogue builder (Step 7) ---- */
function rDialogue(ctx){
  const {it, el, cfg} = ctx;
  el.innerHTML =
    '<p class="instr">'+esc(it.tipFa||"مکالمه را کامل کن.")+"</p>" +
    (it.verbBox ? '<div class="chips">'+it.verbBox.map(v=>'<span class="chip used" style="pointer-events:none">'+esc(v)+"</span>").join("")+"</div>" : "") +
    '<div id="conv"></div><div id="choiceArea"></div>';
  const conv = el.querySelector("#conv"), choiceArea = el.querySelector("#choiceArea");
  wireQFa(el);
  let k = 0;
  function drawLine(){
    if(k >= it.lines.length){ itemResult(ctx, true, {}); return; }
    const l = it.lines[k];
    const d = document.createElement("div");
    d.className = "bub " + (l.s === "Leila" || l.s === "Amir" ? "me" : "");
    d.innerHTML = '<span class="spk">'+esc(l.s||"")+"</span>" +
      '<span class="ltr" dir="ltr" lang="en">'+esc(l.en)+"</span>";
    conv.appendChild(d);
    const ab = htmlEl(audioBtn(l.en));
    d.appendChild(ab);
    if(l.opts){
      const order = shuffle(l.opts);
      choiceArea.innerHTML = '<div class="opts" role="radiogroup"></div>';
      const box = choiceArea.querySelector(".opts");
      order.forEach((o, pos)=> box.appendChild(optionBtn(o, pos, ()=>answer(pos))));
      function answer(pos){
        if(ctx.finished) return;
        const ok = order[pos] === l.opts[l.ans];
        if(ok){
          paintOpts(box, order.indexOf(l.opts[l.ans]), -1);
          choiceArea.innerHTML = "";
          k++; setTimeout(drawLine, 350);
        } else {
          ctx.lastWrong = pos;
          box.children[pos].classList.add("no","dis");
          if(cfg.attempts === 1 || ctx.wrongTries+1 >= cfg.attempts){
            paintOpts(box, order.indexOf(l.opts[l.ans]), pos);
            itemResult(ctx, false, { revealText: l.opts[l.ans] });
          } else { itemResult(ctx, false, {}); }
        }
      }
    } else {
      k++; setTimeout(drawLine, 500);
    }
  }
  drawLine();
}

/* ---- listen and type (Step 7) ---- */
function rListenType(ctx){
  const {it, el} = ctx;
  el.innerHTML =
    '<p class="instr">'+esc(it.qFa||"کلمه را بشنو و بنویس.")+"</p>" +
    '<div style="text-align:center;margin:10px 0">'+audioBtn(it.word, it.audioId)+"</div>" +
    hintBlock(ctx) +
    typedRow();
  wireQFa(el);
  const box = el.querySelector("#typedRow");
  wireTyped(ctx, box, val=>{
    const r = checkTyped({typed:{accept:[it.word]}}, val);
    if(r === true){ itemResult(ctx, true, {}); }
    else if(r === "near" && ctx.firstTry){
      feedback("no", "نزدیک بود! پایان کلمه را بررسی کن.", "دوباره امتحان کن", ()=>{});
    }
    else if(ctx.cfg.attempts === 1 || ctx.wrongTries+1 >= ctx.cfg.attempts){
      showHint(el);
      itemResult(ctx, false, { revealText: it.word });
    } else { showHint(el); itemResult(ctx, false, {}); }
  });
}

/* ---- stress: tap the stressed word (Step 6, s7) ---- */
function rStress(ctx){
  const {it, el, cfg} = ctx;
  const hlWord = it.stress;
  const marked = it.sentence.replace(new RegExp("\\b("+hlWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")+")\\b", "i"),
    '<mark>$1</mark>');
  el.innerHTML =
    '<p class="instr">'+esc(it.qFa||"کلمهٔ تأکیدشده را پیدا کن.")+"</p>" +
    '<div style="text-align:center;margin:10px 0">'+audioBtn(it.sentence, it.audioId)+"</div>" +
    '<div class="inlinepara">'+marked+"</div>" +
    hintBlock(ctx) +
    '<p class="progress-label">روی کلمهٔ تأکیدشده در متن بزن:</p>' +
    '<div class="inlinepara" id="words">' +
      it.sentence.split(/(\s+)/).map(t=> /^\s+$/.test(t) ? t :
        '<span class="w" lang="en" dir="ltr" data-t="'+esc(t)+'">'+esc(t)+"</span>").join("") +
    "</div>" +
    '<div id="meaningArea"></div>';
  const words = el.querySelector("#words"), meaningArea = el.querySelector("#meaningArea");
  wireQFa(el);
  words.querySelectorAll(".w").forEach(sp=>{
    sp.onclick = ()=>{
      if(ctx.finished) return;
      const ok = wordKey(sp.dataset.t) === wordKey(hlWord);
      if(ok){
        sp.classList.add("tgt");
        /* then match the stress to its meaning (Step 6) */
        const order = shuffle(it.meaningOpts);
        meaningArea.innerHTML = '<p class="progress-label">تأکید چه معنی‌ای می‌دهد؟</p><div class="opts" role="radiogroup"></div>';
        const box = meaningArea.querySelector(".opts");
        order.forEach((o,pos)=> box.appendChild(optionBtn(o, pos, ()=>{
          if(ctx.finished) return;
          const okM = order[pos] === it.meaningOpts[it.meaningAns];
          if(okM){ paintOpts(box, order.indexOf(it.meaningOpts[it.meaningAns]), -1); itemResult(ctx, true, {}); }
          else if(cfg.attempts === 1 || ctx.wrongTries+1 >= cfg.attempts){
            paintOpts(box, order.indexOf(it.meaningOpts[it.meaningAns]), pos);
            itemResult(ctx, false, { revealText: it.meaningOpts[it.meaningAns] });
          } else { itemResult(ctx, false, {}); }
        })));      } else { sp.classList.add("missed"); setTimeout(()=>sp.classList.remove("missed"), 500); }
    };
  });
}

/* ============================================================
   STEP RUNNER — rounds items per mode, draws the result card
   with stars/XP/bonus (Steps 3, 4, 7 chunking).
   ============================================================ */
let round = null;   /* {items, idx, firstOk, label, exit} */
function startRound(items, label, exit){
  const cfg = modeCfg();
  const ordered = (label === "practice") ? items : items.slice(0, cfg.round);
  round = { items:ordered, idx:0, firstOk:0, label, exit };
  state.round = round;
  go("step");
}
function renderStep(){
  if(round){ renderRoundStep(); return; }
  /* normal path step */
  const sec = state.section, st = state.steps[state.stepIdx];
  if(!st){ go("home"); return; }
  setProgress(state.stepIdx / Math.max(1, state.steps.length));
  if(st.type === "items"){ startPathRound(st); return; }
  renderBoardStep(st, sec);
}
function startPathRound(st){
  const cfg = modeCfg();
  /* Challenge: cap 8; Guided: 4-5; Standard: 6 — chunk long sets by splitting
     the step's items across consecutive rounds inside the same step. */
  const per = cfg.round;
  const chunks = [];
  for(let i=0;i<st.items.length;i+=per) chunks.push(st.items.slice(i, i+per));
  const stSteps = state.steps;
  runChunks(st, chunks, 0);
  function runChunks(st, chunks, ci){
    round = { items:chunks[ci], idx:0, firstOk:0, label:"path", chunkOf:chunks.length, chunkI:ci,
              exit:()=> endPathStep(st) };
    state.round = round;
    go("step");
  }
}
function endPathStep(st){
  round = null; state.round = null;
  finishStep();
}
function finishStep(){
  const sec = state.section;
  const st = state.steps[state.stepIdx];
  const rec = S.steps[st.id] || {};
  rec.done = true; rec.ts = Date.now();
  S.steps[st.id] = rec;
  if(state.steps.every(x=> S.steps[x.id] && S.steps[x.id].done)){
    S.sections[sec.id] = Object.assign({done:true, tested:false}, S.sections[sec.id]);
  }
  saveSoon(); touchStreak(); saveSoon();
  if(state.stepIdx < state.steps.length-1){ state.stepIdx++; go("step"); }
  else go("done", {sectionId:sec.id});
}
function renderRoundStep(){
  const items = round.items;
  const i = round.idx;
  setProgress(i / Math.max(1, items.length));
  const it = items[i];
  $app.innerHTML = '<div id="stage"></div><div id="stepFoot" style="margin-top:16px;margin-bottom:16px"></div>';
  const stage = document.getElementById("stage");
  let counter = '<p class="progress-label"><span class="sr">پرسش </span>'+faNum(i+1)+" از "+faNum(items.length)+"</p>";
  stage.insertAdjacentHTML("beforeend", counter);
  const holder = document.createElement("div");
  stage.appendChild(holder);
  try{
    renderItem(it, holder, ()=>{
      round.firstOk += firstOkOf(it);
      if(i < items.length-1){ round.idx++; renderRoundStep(); }
      else showResultCard();
    });
  }catch(err){
    console.error("item render error", it && it.id, err);
    holder.innerHTML = '<div class="card"><p class="muted">خطا در نمایش این پرسش.</p></div>';
    nextBtnRaw((i<items.length-1?"بعدی":"پایان"), ()=>{
      if(i < items.length-1){ round.idx++; renderRoundStep(); } else showResultCard();
    });
  }
}
function firstOkOf(it){
  const r = S.items[it.id];
  return r && r.n === 1 && r.first === 1 ? 1 : 0;
}
function showResultCard(){
  const items = round.items;
  const pct = items.length ? round.firstOk / items.length : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : 1;
  const bonus = pct >= 0.7 ? 10 : 0;   /* Step 3 bonus */
  if(bonus) addXP(bonus);
  const st = state.section ? state.steps[state.stepIdx] : null;
  if(st){
    const rec = S.steps[st.id] || {};
    rec.best = Math.max(rec.best || 0, Math.round(pct*100)/100);
    rec.stars = Math.max(rec.stars || 0, stars);
    S.steps[st.id] = rec;
    saveSoon();
  }
  /* suggestion banners (Step 4): never automatic switches */
  S.lastSessions.push({firstPct: Math.round(pct*100)/100, ts:Date.now()});
  if(S.lastSessions.length > 6) S.lastSessions.shift();
  saveSoon();
  const s = suggestBanner();
  $app.innerHTML =
    '<div class="complete resultcard"><div class="big">'+(pct>=0.9?"★★★":pct>=0.7?"★★☆":"★☆☆")+"</div>" +
    '<h1>'+(pct===1?"بی‌نقص!":pct>=0.7?"آفرین!":"ادامه بده!")+"</h1>" +
    '<p class="sub">'+faNum(Math.round(pct*100)) + "٪ درست در اولین تلاش" +
    (bonus ? " — " + faNum(bonus) + " امتیاز جایزه" : "") + "</p>" +
    (s ? '<div class="banner">'+esc(s.text)+'<button class="btn sm" id="sugBtn">'+esc(s.btn)+"</button></div>" : "") +
    '<div id="resBtns"></div></div>';
  const btns = document.getElementById("resBtns");
  const cont = document.createElement("button");
  cont.className = "btn"; cont.textContent = "ادامه";
  cont.onclick = ()=>{
    const exit = round.exit; round = null; state.round = null;
    if(exit) exit(); else go("home");
  };
  btns.appendChild(cont);
  if(s) document.getElementById("sugBtn").onclick = ()=>{
    S.mode = s.mode; saveSoon(); syncModeUI();
    toast("حالت «" + MODES[s.mode].fa + "» انتخاب شد");
  };
}
function suggestBanner(){
  const l = S.lastSessions;
  if(l.length < 2) return null;
  const a = l[l.length-2], b = l[l.length-1];
  if(S.mode !== "challenge" && a.firstPct >= 0.9 && b.firstPct >= 0.9)
    return {mode:"challenge", text:"دو بار عالی جواب دادی. می‌خواهی چالشی را امتحان کنی؟", btn:"امتحان چالشی"};
  if((S.mode === "standard" || S.mode === "challenge") && a.firstPct < 0.5 && b.firstPct < 0.5)
    return {mode:"guided", text:"دو بار سخت بود. می‌خواهی با راهنمای بیشتری ادامه دهی؟", btn:"راهنمایی‌شده"};
  return null;
}
function nextBtnRaw(label, fn){
  const f = document.getElementById("stepFoot");
  f.innerHTML = '<button class="btn" id="nx">'+esc(label||"ادامه")+"</button>";
  document.getElementById("nx").onclick = fn;
}

/* ============================================================
   BOARD STEPS (match / sort / cloze / teach / flashcards / reading /
   skim_scan / speak / dialog_reveal / wordbuild / intro)
   ============================================================ */
function renderBoardStep(st, sec){
  setProgress(state.stepIdx / Math.max(1, state.steps.length));
  $app.innerHTML = '<div id="stage"></div><div id="stepFoot" style="margin-top:16px;margin-bottom:16px"></div>';
  const stage = document.getElementById("stage");
  const R = {
    intro:rIntro, teach:rTeach, flashcards:rFlashcards, reading:rReading,
    skim_scan:rSkimScan, speak:rSpeak, dialog_reveal:rDialogReveal,
    wordbuild:rWordBuild, match:rBoardMatch, sort:rSort, cloze:rCloze
  }[st.type];
  if(!R){ nextBtnRaw("ادامه", finishStep); return; }
  try{ R(st, stage); }
  catch(err){
    console.error("step render error", st.id, err);
    stage.innerHTML = '<div class="card"><p class="muted">خطا در نمایش این بخش.</p></div>';
    nextBtnRaw("رد کردن", finishStep);
  }
}
function rIntro(st, el){
  el.innerHTML = '<div class="card" style="text-align:center;padding:26px 18px">' +
    '<h2>'+esc(st.title)+"</h2>" +
    '<p style="line-height:1.9;white-space:pre-line">'+esc(st.body)+"</p></div>";
  nextBtnRaw(st.cta || "شروع", ()=>{
    /* “first-time student reaches a question in 3 taps” (Step 8) */
    if(state.stepIdx < state.steps.length-1){ state.stepIdx++; go("step"); }
    else finishStep();
  });
}

/* teach — Step 10 four-part cards */
function rTeach(st, el){
  let ci = 0;
  function draw(){
    const c = st.cards[ci];
    el.innerHTML = '<div class="teachcard">' +
      '<p class="rule">'+c.ruleFa+"</p>" +
      '<div class="formula">'+c.formula+"</div>" +
      '<p class="contrast">'+c.contrastFa+"</p>" +
      '<div class="mistake"><span class="bad">✗ '+esc(c.mistake.bad)+"</span>" +
      '<span class="good">✓ '+esc(c.mistake.good)+"</span></div>" +
      (c.exs ? c.exs.map(ex=>
        '<div class="teachex"><div class="en">'+tap(ex.en, ex.fa)+" "+audioBtn(ex.en, ex.audioId)+"</div>" +
        '<div class="fa">'+esc(ex.fa||"")+"</div></div>").join("") : "") +
      "</div>" +
      '<p class="progress-label">'+faNum(ci+1)+" از "+faNum(st.cards.length)+"</p>";
    nextBtnRaw(ci < st.cards.length-1 ? "بعدی" : "فهمیدم", ()=>{
      if(ci < st.cards.length-1){ ci++; draw(); }
      else finishStep();
    });
  }
  draw();
}

/* flashcards (SRS card creation on first sight, Step 5) */
function rFlashcards(st, el){
  let i = 0;
  function draw(){  const w = st.words[i];
    el.innerHTML = '<div class="card">' +
      '<div class="xpbar"><span>'+faNum(i+1)+"از "+faNum(st.words.length)+"</span>" +
      '<button class="btn sec sm" id="spk">تلفظ</button></div>' +
      '<div class="fc" id="fc"><div class="face"><div class="en">'+esc(w.w)+"</div>" +
      (w.ex ? '<div class="muted ltr" dir="ltr" lang="en">'+esc(w.ex)+"</div>" : "") +
      '<div class="muted">برای دیدن معنی بزن</div></div>' +
      '<div class="face back" style="display:none"><div class="fa">'+esc(w.fa)+"</div></div></div>" +
      '<div class="row"><button class="btn sm" id="nxt" style="flex:1">'+(i<st.words.length-1?"بعدی":"پایان")+"</button></div></div>";
    const fc = document.getElementById("fc");
    const back = fc.querySelector(".back");
    fc.onclick = ()=>{ back.style.display = back.style.display === "none" ? "flex" : "none"; };
    document.getElementById("spk").onclick = e=>{ e.stopPropagation(); playWordAudio(w.w); };
    if(!S.cards.some(c=>c.w === w.w.toLowerCase())){
      S.cards.push({w:w.w.toLowerCase(), fa:w.fa||"", box:0, due:Date.now(), lapses:0});
      saveSoon();
    }
    document.getElementById("nxt").onclick = ()=>{
      if(i < st.words.length-1){ i++; draw(); } else finishStep();
    };
  }
  draw();
}

/* reading with per-sentence audio + tap gloss (Step 11) */
function rReading(st, el){
  let html = "";
  if(st.tip) html += '<p class="instr">'+esc(st.tip)+"</p>";
  st.paras.forEach(para=>{
    para.en.forEach((s, idx)=>{
      html += '<div class="sentblock">'+tap(s, (para.fa||[])[idx]||"") +
        '<div style="margin-top:6px">'+audioBtn(s)+"</div></div>";
    });
  });
  el.innerHTML = html;
  nextBtnRaw("پایان", finishStep);
}

/* skim & scan (two phases, timer) */
function rSkimScan(st, el){
  let timeLeft = st.timer || 30, timerId = null;
  function drawSkim(){
    el.innerHTML = '<p class="instr">۱) متن را سریع بخوان. بعد از پایان زمان، سؤال می‌بینی.</p>' +
      '<div class="timer" id="timer">'+faNum(timeLeft)+"</div>" +
      st.paras.map(p=>'<div class="para">'+esc(p)+"</div>").join("") +
      '<button class="btn sec" id="done">تمام شد — ادامه</button>';
    const tEl = document.getElementById("timer");
    timerId = setInterval(()=>{
      timeLeft--; tEl.textContent = faNum(Math.max(0,timeLeft));
      if(timeLeft <= 10) tEl.classList.add("warn");
      if(timeLeft <= 0){ clearInterval(timerId); timerId = null; drawScan(); }
    }, 1000);
    stepCleanup = ()=>{ if(timerId) clearInterval(timerId); };
    document.getElementById("done").onclick = ()=>{ if(timerId){clearInterval(timerId); timerId=null;} drawScan(); };
  }
  function drawScan(){
    stepCleanup = null;
    const options = buildOptions({opts:st.scanOpts, ans:st.scanAns});
    const correctIdx = options.indexOf(st.scanOpts[st.scanAns]);
    el.innerHTML = '<p class="instr">۲) اسکن — جواب را پیدا کن.</p>' +
      '<p class="q ltr" dir="ltr" lang="en">'+esc(st.scanQ)+"</p>" +
      (st.scanQFa ? '<p class="q-fa">'+esc(st.scanQFa)+"</p>" : "") +
      '<div class="opts" role="radiogroup" id="opts"></div>' +
      '<button class="btn sec sm" id="showPara">نمایش متن</button>' +
      '<div id="paraBox" style="display:none">'+st.paras.map(p=>'<div class="para">'+esc(p)+"</div>").join("")+"</div>";
    const box = el.querySelector("#opts");
    options.forEach((o, pos)=> box.appendChild(optionBtn(o, pos, ()=>answer(pos))));
    document.getElementById("showPara").onclick = ()=>{
      const p = document.getElementById("paraBox");
      p.style.display = p.style.display === "none" ? "block" : "none";
    };
    let answered = false;
    function answer(pos){
      if(answered) return;
      const ok = pos === correctIdx;
      answered = true;
      paintOpts(box, correctIdx, ok ? -1 : pos);
      feedback(ok ? "ok" : "reveal", st.exFa || st.scanExFa,
        ok ? "ادامه" : "ادامه", ()=> finishStep(), ok ? undefined : st.scanOpts[st.scanAns]);
    }
  }
  drawSkim();
}

/* speak (Step 6/11: model, record, playback, self-check chips) */
function rSpeak(st, el){
  let i = 0, rec = null, chunks = [], timerId = null;
  const hasRec = !!(navigator.mediaDevices && window.MediaRecorder);
  function draw(){
    const it = st.items[i];
    let marked = esc(it.en);
    if(it.hl){
      marked = it.en.replace(new RegExp("("+it.hl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")+")"),
        '<mark>$1</mark>');
      marked = marked.replace(/^/, "");
    }
    el.innerHTML = '<div class="card">' +
      '<div class="xpbar"><span>'+faNum(i+1)+" از "+faNum(st.items.length)+"</span></div>" +
      (st.tip ? '<p class="instr">'+esc(st.tip)+"</p>" : "") +
      (st.starters ? '<div class="hintbox"><span class="hlabel">جمله‌های کمکی: </span>'+st.starters.map(esc).join(" · ")+"</div>" : "") +
      '<p class="ltr" dir="ltr" lang="en" style="font-size:20px;font-weight:700;text-align:center;margin:14px 0">'+marked+"</p>" +
      (it.fa ? '<p class="q-fa" style="text-align:center">'+esc(it.fa)+"</p>" : "") +
      '<div class="row" style="justify-content:center">'+audioBtn(it.en, it.audioId)+"</div>" +
      '<div id="recArea" style="margin-top:12px"></div>' +
      '<div id="chips" style="margin-top:12px"></div></div>';
    const ra = document.getElementById("recArea");
    if(hasRec){
      ra.innerHTML = '<div class="row"><button class="btn sec sm" id="rec" style="flex:1">ضبط (تا ۱۵ ثانیه)</button>' +
        '<button class="btn sec sm" id="cancel" style="flex:0 0 auto">لغو</button></div><div id="recState" class="muted" style="margin-top:6px"></div>';
      const rb = document.getElementById("rec"), rs = document.getElementById("recState");
      document.getElementById("cancel").onclick = ()=>{ stopRec(false); };
      rb.onclick = async ()=>{
        if(rec && rec.state === "recording"){ stopRec(true); return; }
        try{
          const stream = await navigator.mediaDevices.getUserMedia({audio:true});
          chunks = [];
          const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
                     : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
          rec = mime ? new MediaRecorder(stream, {mimeType:mime}) : new MediaRecorder(stream);
          rec.ondataavailable = e=>chunks.push(e.data);
          rec.onstop = ()=>{
            stream.getTracks().forEach(t=>t.stop());
            clearInterval(timerId);
            if(!rec.__keep){ rs.textContent = ""; rb.textContent = "ضبط (تا ۱۵ ثانیه)"; return; }
            const url = URL.createObjectURL(new Blob(chunks, {type:rec.mimeType||"audio/webm"}));
            rs.innerHTML = '<audio controls src="'+url+'" style="width:100%;margin-top:8px"></audio>';
            rb.textContent = "ضبط دوباره";
            showChips();
          };
          rec.__keep = true;
          rec.start();
          rb.textContent = "توقف";
          rs.textContent = "در حال ضبط…";
          timerId = setTimeout(()=>{ if(rec && rec.state === "recording") stopRec(true); }, 15000);
        }catch(e){
          rs.textContent = "دسترسی به میکروفون ممکن نشد — بلند بگو و خودت را بسنج.";
          showChips();
        }
      };
    } else {
      ra.innerHTML = '<p class="muted">میکروفون در دسترس نیست — جمله را بلند بگو، بعد خودت را بسنج.</p>';
      showChips();
    }
    function stopRec(keep){ if(rec && rec.state === "recording"){ rec.__keep = keep; rec.stop(); } }
    function showChips(){
      const ch = document.getElementById("chips");
      if(ch.dataset.on) return;
      ch.dataset.on = "1";
      ch.innerHTML = '<p class="progress-label">خودت را بسنج:</p><div class="row">' +
        ["تأکید روی کلمهٔ درست","تلفظ واضح پایان کلمه‌ها","سرعت طبیعی"].map((t,k)=>
          '<button class="chip" data-c="'+k+'" style="direction:rtl">'+esc(t)+"</button>").join("") + "</div>";
      let n = 0;
      ch.querySelectorAll(".chip").forEach(c=>{
        c.onclick = ()=>{ c.classList.add("picked"); c.style.pointerEvents = "none";
          if(++n === 3){ addXP(3); toast("+۳ امتیاز خودارزیابی"); } };
      });
    }
    document.querySelector("#stepFoot") && nextBtnRaw(i < st.items.length-1 ? "بعدی" : "پایان", ()=>{
      if(i < st.items.length-1){ i++; draw(); } else finishStep();
    });
  }
  draw();
}

/* dialog_reveal — line by line with tap gloss */
function rDialogReveal(st, el){
  let i = 0;
  function draw(){
    const l = st.lines[i];
    el.innerHTML = '<div class="xpbar"><span>'+faNum(i+1)+" از "+faNum(st.lines.length)+"</span>" +
      '<button class="btn sec sm" id="tr">ترجمه</button></div>' +
      '<div class="bub"><span class="spk">'+esc(l.s)+"</span>" + tap(l.en, l.fa) +
      '<div style="margin-top:8px">'+audioBtn(l.en, l.audioId)+"</div></div>" +
      '<div id="trBox" class="hintbox" style="display:none">'+esc(l.fa)+"</div>";
    document.getElementById("tr").onclick = ()=>{
      const tb = document.getElementById("trBox");
      tb.style.display = tb.style.display === "none" ? "block" : "none";
    };
    nextBtnRaw(i < st.lines.length-1 ? "خط بعدی" : "پایان", ()=>{
      if(i < st.lines.length-1){ i++; draw(); } else finishStep();
    });
  }
  draw();
}

/* wordbuild — sentence building with tap gloss (Step 6 missing items) */
function rWordBuild(st, el){
  let i = 0;
  function draw(){
    const it = st.items[i];
    el.innerHTML = '<div class="xpbar"><span>'+faNum(i+1)+" از "+faNum(st.items.length)+"</span>" +
      '<button class="btn sec sm" id="all">نمایش همه</button></div>' +
      '<div class="sentblock"><div id="sentBox" class="ltr" dir="ltr" lang="en" style="font-size:18px;line-height:2.4"></div>' +
      '<div class="fa" id="faBox" style="display:none">'+esc(it.fa)+"</div></div>" +
      '<div style="text-align:center;margin:10px 0">'+audioBtn(it.en, it.audioId)+"</div>" +
      '<div id="checkBox"></div>';
    const box = document.getElementById("sentBox");
    it.en.split(" ").forEach((t, idx, arr)=>{
      const key = wordKey(t);
      const span = document.createElement("span");
      span.className = "w"; span.textContent = t; span.dataset.w = key;
      span.onclick = e=>{ e.stopPropagation(); span.classList.add("seen"); wordPopup(key); };
      box.appendChild(span);
      if(idx < arr.length-1) box.appendChild(document.createTextNode(" "));
    });
    document.getElementById("all").onclick = ()=>{
      box.querySelectorAll(".w").forEach(x=>x.classList.add("seen"));
      document.getElementById("faBox").style.display = "block";
    };
    if(it.check){
      renderSubChoice(it.check, document.getElementById("checkBox"), ()=>{
        if(i < st.items.length-1){ i++; draw(); } else finishStep();
      });
    } else {
      nextBtnRaw(i < st.items.length-1 ? "جملهٔ بعدی" : "پایان", ()=>{
        if(i < st.items.length-1){ i++; draw(); } else finishStep();
      });
    }
  }
  draw();
}
/* graded sub-choice inside wordbuild — full Step 3 flow (2 attempts) */
function renderSubChoice(c, box, next){
  const options = buildOptions(c);
  const correctIdx = options.indexOf(c.opts[c.ans]);
  box.innerHTML = '<p class="q ltr" dir="ltr" lang="en" style="font-size:17px">'+esc(c.q)+"</p>" +
    (c.qFa ? '<p class="q-fa">'+esc(c.qFa)+"</p>" : "") +
    '<div class="opts" role="radiogroup"></div>';
  const cbo = box.querySelector(".opts");
  let wrongTries = 0, answered = false;
  options.forEach((o, pos)=> cbo.appendChild(optionBtn(o, pos, ()=>{
    if(answered) return;
    const ok = pos === correctIdx;
    if(ok){
      answered = true;
      paintOpts(cbo, correctIdx, wrongTries ? cbo._lastWrong : -1);
      record(c.id, wrongTries === 0);
      feedback("ok", c.exFa, "ادامه", next);
    } else {
      cbo._lastWrong = pos;
      wrongTries++;
      cbo.children[pos].classList.add("no","dis");
      record(c.id, false);
      if(wrongTries >= 2){
        answered = true;
        paintOpts(cbo, correctIdx, pos);
        feedback("reveal", c.exFa, "ادامه", next, c.opts[c.ans]);
      } else {
        feedback("no", c.exFa, "دوباره امتحان کن", ()=>{});
      }
    }
  })));
}

/* board match (whole-step, with distractor + items count = one graded item) */
function rBoardMatch(st, el){
  el.innerHTML = '<p class="instr">'+esc(st.tip||"جفت‌ها را پیدا کن.")+"</p>" +
    '<div class="mgrid"><div class="mcol" id="cL"></div><div class="mcol" id="cR"></div></div>';
  const cL = el.querySelector("#cL"), cR = el.querySelector("#cR");
  let selL = null, matched = 0, errs = 0;
  st.left.forEach((x, idx)=>{
    const d = document.createElement("button");
    d.className = "mitem"; d.type = "button";
    d.innerHTML = '<span class="ltr" dir="ltr" lang="en">'+esc(x.txt)+"</span>";
    d.dataset.id = String(idx);
    d.onclick = ()=>{ if(d.classList.contains("ok")) return;
      cL.querySelectorAll(".mitem").forEach(e=>e.classList.remove("sel"));
      d.classList.add("sel"); selL = d; };
    cL.appendChild(d);
  });
  shuffle(st.right.map((x,i)=>({...x, _i:i}))).forEach(x=>{
    const d = document.createElement("button");
    d.className = "mitem"; d.type = "button";
    d.innerHTML = x.m >= 0 && /^[؀-ۿ]/.test(x.t) ? '<span dir="rtl">'+esc(x.t)+"</span>"
      : '<span class="ltr" dir="ltr" lang="en">'+esc(x.t)+"</span>";
    d.dataset.m = String(x.m);
    d.onclick = ()=>{
      if(d.classList.contains("ok") || !selL) return;
      if(+d.dataset.m === +selL.dataset.id){
        selL.classList.remove("sel"); selL.classList.add("ok"); d.classList.add("ok");
        matched++; selL = null;
        if(matched === st.left.length){
          setTimeout(()=>{
            feedback("ok", st.exFa || "همه را درست مطابقت دادی!", "ادامه", finishStep);
          }, 250);
        }
      } else if(d.dataset.m === "-1"){
        d.classList.add("no"); setTimeout(()=>d.classList.remove("no"), 400);
        toast("این گزینه جفت ندارد.");
      } else {
        errs++;
        d.classList.add("no"); setTimeout(()=>d.classList.remove("no"), 400);
        selL.classList.remove("sel"); selL = null;
        if(errs >= 2){
          st.left.forEach((_, k)=>{
            const L = cL.children[k];
            const Rr = [...cR.children].find(r=>+r.dataset.m === k);
            if(L && Rr){ L.classList.add("ok"); Rr.classList.add("ok"); }
          });
          setTimeout(()=>feedback("reveal", st.exFa || "", "ادامه", finishStep,
            "جفت‌های درست مشخص شدند"), 400);
        }
      }
    };
    cR.appendChild(d);
  });
}

/* sort (action vs state, s8c) */
function rSort(st, el){
  let sel = null, placed = 0, errs = 0;
  el.innerHTML = '<p class="instr">'+esc(st.tip||"هر مورد را در دستهٔ درست قرار بده.")+"</p>" +
    '<div class="chips" id="pool"></div><div class="bins" id="bins"></div>';
  const pool = document.getElementById("pool"), bins = document.getElementById("bins");
  shuffle(st.items).forEach(it=>{
    const c = document.createElement("button");
    c.className = "chip"; c.type = "button"; c.textContent = it.t;
    c.style.direction = "ltr";
    c.onclick = ()=>{ pool.querySelectorAll(".chip").forEach(x=>x.classList.remove("picked"));
      c.classList.add("picked"); sel = c; };
    pool.appendChild(c);
  });
  st.bins.forEach((name, bi)=>{
    const b = document.createElement("div"); b.className = "bin";
    b.innerHTML = "<h4>"+esc(name)+"</h4><div class='inner'></div>";
    b.onclick = ()=>{
      if(!sel) return;
      if(+sel.dataset.b === bi){
        b.querySelector(".inner").appendChild(sel);
        sel.classList.remove("picked"); sel.classList.add("used");
        sel.style.pointerEvents = "none"; sel = null; placed++;
        if(placed === st.items.length) setTimeout(()=>feedback("ok", st.exFa || "همه درست بود!", "ادامه", finishStep), 250);
      } else {
        errs++;
        sel.classList.add("no"); setTimeout(()=>sel.classList.remove("no"), 400);
        if(errs >= 2){
          st.items.forEach(x=>{ /* reveal: mark correct bins */ });
          setTimeout(()=>feedback("reveal", st.exFa || "", "ادامه", finishStep,
            st.items.map(x=>x.t + " → " + st.bins[x.b]).join(" · ")), 300);
        }
      }
    };
    bins.appendChild(b);
  });
}

/* cloze (fill blanks from a word bank, s9d) */
function rCloze(st, el){
  const rows = st.blanks.map(b=>({ opts:b.opts, ans:b.ans, hintFa:b.hintFa, exFa:b.exFa,
    order: shuffle(b.opts.map((_,i)=>i)) }));
  const picked = st.blanks.map(()=>null);
  let answered = false;
  function paint(){
    el.querySelectorAll(".gap").forEach(g=>{
      const i = +g.dataset.g, v = picked[i];
      g.textContent = v == null ? "＿＿＿" : rows[i].opts[v];
      g.className = "gap" + (v == null ? "" : " filled");
    });
    el.querySelectorAll(".chip[data-r]").forEach(c=>{
      c.classList.toggle("picked", picked[+c.dataset.r] === +c.dataset.o);
    });
    const chk = document.getElementById("cchk");
    if(chk) chk.disabled = !picked.every(v=>v != null);
  }
  el.innerHTML = '<p class="instr">'+esc(st.tip||"جای خالی‌ها را پر کن.")+"</p>" +
    '<div class="inlinepara">' + st.parts.map((p,i)=> esc(p) +
      (i < st.parts.length-1 ? '<span class="gap" data-g="'+i+'">＿＿＿</span>' : "")).join("") + "</div>" +
    rows.map((r,i)=>'<p class="progress-label">جای خالی '+faNum(i+1)+"</p>" +
      '<div class="chips">'+r.order.map(o=>'<button class="chip" data-r="'+i+'" data-o="'+o+'">'+esc(r.opts[o])+"</button>").join("")+"</div>").join("") +
    '<button class="btn" id="cchk" disabled>بررسی</button>';
  el.querySelectorAll(".chip[data-r]").forEach(c=>{
    c.onclick = ()=>{ if(answered) return;
      const r = +c.dataset.r, o = +c.dataset.o;
      picked[r] = picked[r] === o ? null : o; paint(); };
  });
  el.querySelectorAll(".gap").forEach(g=>{
    g.onclick = ()=>{ if(answered) return; picked[+g.dataset.g] = null; paint(); };
  });
  paint();
  document.getElementById("cchk").onclick = ()=>{
    if(answered) return;
    answered = true;
    let allOk = true;
    st.blanks.forEach((b,i)=>{
      const ok = picked[i] === b.ans;
      if(!ok) allOk = false;
      const g = el.querySelector('.gap[data-g="'+i+'"]');
      if(g) g.classList.add(ok ? "ok" : "no");
    });
    const sol = st.blanks.map((b,i)=>rows[i].opts[b.ans]).join(" · ");
    if(allOk) feedback("ok", st.exFa || "همهٔ جای خالی‌ها درست بود!", "ادامه", finishStep);
    else feedback("reveal", st.exFa || "", "ادامه", finishStep, sol);
  };
}

function renderDone(sectionId){
  const sec = state.lesson.sections.find(s=>s.id === sectionId) || state.section;
  if(!sec){ go("home"); return; }
  state.section = sec;
  const idx = state.lesson.sections.indexOf(sec);
  const next = state.lesson.sections[idx+1];
  playFx("levelup"); /* achievement fanfare: chunk completed */
  const tested = S.sections[sec.id] && S.sections[sec.id].tested;
  $app.innerHTML = '<div class="complete"><div class="big">'+(tested?"✓":"★")+"</div>" +
    '<h1>'+(tested?"بخش با آزمون کامل شد!":"بخش کامل شد!")+"</h1>" +
    '<p class="sub">'+esc(sec.title)+"</p>" +
    '<div class="rewards">' +
    '<div class="reward"><span class="k">امتیاز</span><span class="v">'+faNum(S.xp)+"</span></div>" +
    '<div class="reward"><span class="k">روز پیوسته</span><span class="v">'+faNum(S.streak.count)+"</span></div></div>" +
    (next ? '<button class="btn" id="dnNext">بخش بعدی</button><div style="height:10px"></div>' : "") +
    '<button class="btn sec" id="dnBack">بازگشت به خانه</button></div>';
  if(next) document.getElementById("dnNext").onclick = ()=> go("section", {sectionId:next.id});
  document.getElementById("dnBack").onclick = ()=> go("home");
}

/* ============================================================
   HOME (Step 8): mode switch, Continue, goal ring, section path
   ============================================================ */
const SEC_ICONS = {
  target:'<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7a5 5 0 1 0 5 5"/><circle cx="12" cy="12" r="1"/>',
  chat:'<path d="M4 6h16v10H9l-5 4z"/><path d="M8 10h8"/><path d="M8 13h5"/>',
  book:'<path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5z"/><path d="M19 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  read:'<path d="M4 5h7v15H6a2 2 0 0 1-2-2z"/><path d="M20 5h-7v15h5a2 2 0 0 0 2-2z"/><path d="M8 9h1M8 12h1"/>',
  puzzle:'<path d="M5 8h4V5a2 2 0 1 1 4 0v3h4v5h-2a2 2 0 1 0 0 4h2v3H5z"/>',
  headset:'<path d="M5 13a7 7 0 0 1 14 0"/><rect x="4" y="13" width="4" height="6" rx="1.5"/><rect x="16" y="13" width="4" height="6" rx="1.5"/>',
  mic:'<rect x="9" y="4" width="6" height="10" rx="3"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/>',
  pen:'<path d="M5 19l1-4L17 4l3 3L9 18z"/><path d="M13 8l3 3"/>',
  trophy:'<path d="M8 5h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 5"/><path d="M16 6h3a3 3 0 0 1-3 5"/><path d="M12 14v4"/><path d="M8 20h8"/>'
};
function secIconSvg(name){
  return '<svg class="ni" viewBox="0 0 24 24" aria-hidden="true">'+(SEC_ICONS[name]||SEC_ICONS.book)+"</svg>";
}
function starRow(n){
  let s = "";
  for(let i=0;i<3;i++) s += i < n ? '<span class="on">★</span>' : "<span>☆</span>";
  return '<span class="stars" aria-label="'+faNum(n)+' ستاره از ۳">'+s+"</span>";
}
function renderHome(){
  const lesson = LESSONS[0];
  state.lesson = lesson;
  const total = lesson.sections.reduce((n,s)=>n+s.steps.length,0);
  const doneN = lesson.sections.reduce((n,s)=>n+s.steps.filter(x=>S.steps[x.id]&&S.steps[x.id].done).length,0);
  /* today's goal ring (Step 8) */
  const todayDone = lesson.sections.reduce((n,s)=>n+s.steps.filter(x=>{
    const r = S.steps[x.id]; return r && r.done && r.ts && today() === new Date(r.ts).toLocaleDateString("en-CA");
  }).length,0);
  const goal = Math.max(1, S.goal.perDay);
  const goalPct = Math.min(1, todayDone/goal);
  const R = 30, C = 2*Math.PI*R;
  let html =
    '<div class="pagehead"><h1>English 2 — درس ۱</h1>' +
    '<p class="sub ltr" dir="ltr" lang="en">'+esc(lesson.en)+"</p></div>" +
    '<div class="seg" id="modeSeg" role="tablist" aria-label="حالت مطالعه">' +
      Object.keys(MODES).map(m=>'<button role="tab" aria-selected="'+(S.mode===m)+'" data-mode="'+m+'" class="'+(S.mode===m?"on":"")+'">'+MODES[m].fa+"</button>").join("") + "</div>" +
    '<div class="homeblock" style="display:flex;gap:14px;align-items:center">' +
      '<div class="goalring"><svg viewBox="0 0 84 84"><circle class="track" cx="42" cy="42" r="'+R+'"/>' +
      '<circle class="fill" cx="42" cy="42" r="'+R+'" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-goalPct)).toFixed(1)+'"/></svg>' +
      '<span class="lbl">'+faNum(todayDone)+"/"+faNum(goal)+"</span></div>" +
      '<div style="flex:1"><p style="margin:0;font-weight:800">هدف امروز</p>' +
      '<p class="muted" style="margin:0">'+faNum(doneN)+" از "+faNum(total)+" گام در این درس</p></div></div>";
  /* Continue names the exact stopped step (Step 8) */
  const cont = findContinue();
  if(cont){
    html += '<div class="homeblock"><button class="continue" id="contBtn">' +
      '<span class="c1">ادامه</span><span class="c2">'+esc(cont.label)+"</span></button></div>";
  }
  /* vertical section path */
  html += '<div class="path" id="path">';
  let tookCurrent = false;
  lesson.sections.forEach((sec, i)=>{
    const t = sec.steps.length;
    const d = sec.steps.filter(x=>S.steps[x.id]&&S.steps[x.id].done).length;
    const done = d >= t;
    const prevDone = i === 0 || lesson.sections[i-1].steps.every(x=>S.steps[x.id]&&S.steps[x.id].done)
      || (S.sections[lesson.sections[i-1].id] && S.sections[lesson.sections[i-1].id].done);
    const tested = S.sections[sec.id] && S.sections[sec.id].tested;
    const locked = !prevDone && d === 0 && !tested;
    const current = !done && !locked && !tookCurrent;
    if(current) tookCurrent = true;
    const stars = sec.steps.reduce((n,x)=> n + ((S.steps[x.id]&&S.steps[x.id].stars)||0), 0);
    const maxStars = t*3;
    html += '<div class="prow">' +
      (i>0 ? '<div class="pconn '+(done?"done":"")+'"></div>' : "") +
      '<div class="pnode '+(done?"done":current?"current":locked?"locked":"available")+'" data-sec="'+sec.id+'" style="--off:0px" role="button" tabindex="'+(locked?"-1":"0")+'" aria-label="'+esc(sec.title)+'">' +
      '<div class="pb">'+(locked
        ? '<svg class="ni" viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/></svg>'
        : secIconSvg(sec.icon)) + "</div>" +
      '<div class="pcap">'+esc(sec.title)+"</div>" +
      (d>0 ? '<div class="stars">'+faNum(stars)+"/"+faNum(maxStars)+" ★</div>" : "") +
      (locked ? '<button class="testout" data-testout="'+sec.id+'">آزمون سریع</button>' : "") +
      "</div></div>";
  });
  html += "</div>";
  $app.innerHTML = html;
  syncModeUI();
  const seg = document.getElementById("modeSeg");
  seg.querySelectorAll("button").forEach(b=>{
    b.onclick = ()=>{ S.mode = b.dataset.mode; saveSoon(); syncModeUI();
      toast("حالت «"+MODES[S.mode].fa+"» — از گام بعدی اعمال می‌شود"); };
  });
  if(cont) document.getElementById("contBtn").onclick = ()=>{
    state.section = cont.sec; state.steps = cont.sec.steps; state.stepIdx = cont.idx;
    round = null; state.round = null;
    go("step");
  };
  $app.querySelectorAll(".pnode[data-sec]").forEach(n=>{
    const open = ()=>{ round = null; state.round = null; go("section", {sectionId:n.dataset.sec}); };
    n.onclick = open;
    n.onkeydown = e=>{ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } };
  });
  $app.querySelectorAll("[data-testout]").forEach(b=>{
    b.onclick = e=>{ e.stopPropagation(); startTestOut(b.dataset.testout); };
  });
}
function syncModeUI(){
  const seg = document.getElementById("modeSeg");
  if(!seg) return;
  seg.querySelectorAll("button").forEach(b=>{
    b.classList.toggle("on", b.dataset.mode === S.mode);
    b.setAttribute("aria-selected", String(b.dataset.mode === S.mode));
  });
}
function findContinue(){
  const lesson = LESSONS[0];
  for(const sec of lesson.sections){
    for(let i=0;i<sec.steps.length;i++){
      if(!(S.steps[sec.steps[i].id] && S.steps[sec.steps[i].id].done))
        return {sec, idx:i, label:(sec.title + " — " + (sec.steps[i].title || "گام "+(i+1)))};
    }
  }
  return null;
}

/* ---- Test out (Step 4): 5 core items, >=90% completes the section ---- */
function startTestOut(secId){
  const lesson = LESSONS[0];
  const sec = lesson.sections.find(s=>s.id === secId);
  if(!sec) return;
  const coreItems = [];
  sec.steps.forEach(st=> (st.items||[]).forEach(it=>{ if(it.core) coreItems.push(it); }));
  const picked = pickN(coreItems, 5);
  if(!picked.length){ toast("برای این بخش پرسش آزمونی موجود نیست"); return; }
  round = { items:picked, idx:0, firstOk:0, label:"testout",
            exit:()=>{
              const pct = picked.length ? round.firstOk / picked.length : 0;
              round = null; state.round = null;
              if(pct >= 0.9){
                S.sections[secId] = Object.assign({done:true, tested:true}, S.sections[secId]);
                saveSoon();
                toast("آفرین! بخش با آزمون کامل شد");
                go("home");
              } else {
                toast("به ۹۰٪ نرسیدی — بخش را ادامه بده");
                go("home");
              }
            } };
  state.round = round;
  go("step");
}
/* result card must count testout firsts too */
function firstOkOfTestOut(){ return null; }

/* ============================================================
   FIRST RUN (Step 8): 3 skippable screens
   ============================================================ */
function isFirstRun(){ return !localStorage.getItem(STORE_KEY+"_seen"); }
function renderFirstRun(page){
  page = page || 1;
  const skip = '<button class="btn sec sm" id="frSkip" style="margin-top:10px">رد کردن</button>';
  if(page === 1){
    $app.innerHTML = '<div class="pagehead"><h1>چطور می‌خواهی درس بخوانی؟</h1></div>' +
      '<div class="card">' +
      Object.keys(MODES).map(m=>
        '<div style="margin:10px 0"><button class="btn sec" data-frmode="'+m+'" style="flex-direction:column;align-items:flex-start">' +
        '<b>'+MODES[m].fa+'</b><small class="muted">'+({
          guided:"۲ گزینه، راهنما همیشه، صدای آهسته — برای شروع",
          standard:"۳ گزینه، ترجمه با یک ضربه — حالت پیشنهادی",
          challenge:"۴ گزینه و تایپ، بدون راهنما — برای تسلط"
        })[m]+"</small></button></div>").join("") + "</div>" + skip;
    $app.querySelectorAll("[data-frmode]").forEach(b=>{
      b.onclick = ()=>{ S.mode = b.dataset.frmode; saveSoon(); renderFirstRun(2); };
    });
  } else if(page === 2){
    $app.innerHTML = '<div class="pagehead"><h1>هدف روزانه‌ات چند گام است؟</h1></div>' +
      '<div class="card"><div class="seg" id="goalSeg">' +
      [1,2,3].map(n=>'<button data-goal="'+n+'" class="'+(S.goal.perDay===n?"on":"")+'">'+faNum(n)+" گام</button>").join("") +
      "</div></div>" + skip;
    $app.querySelectorAll("[data-goal]").forEach(b=>{
      b.onclick = ()=>{ S.goal.perDay = +b.dataset.goal; saveSoon(); renderFirstRun(3); };
    });
  } else {
    localStorage.setItem(STORE_KEY+"_seen", "1");
    go("home");
    return;   /* page 3 has no skip button */
  }
  const frSkip = document.getElementById("frSkip");
  if(frSkip) frSkip.onclick = ()=>{ localStorage.setItem(STORE_KEY+"_seen","1"); go("home"); };
}

/* ============================================================
   SECTION SCREEN (Step 8): step list with icons, titles, stars
   ============================================================ */
const STEP_TYPE_FA = {
  items:"تمرین", teach:"آموزش", flashcards:"کارت‌ها", match:"تطبیق", sort:"دسته‌بندی",
  cloze:"جای خالی", reading:"متن", skim_scan:"خواندن سریع", speak:"گفتاری",
  dialog_reveal:"مکالمه", wordbuild:"واژه‌سازی", intro:"مقدمه"
};
function renderSection(sectionId){
  const sec = LESSONS[0].sections.find(s=>s.id === sectionId);
  if(!sec){ go("home"); return; }
  state.section = sec; state.steps = sec.steps;
  const locked = isSectionLocked(sec);
  let html = '<div class="toprow"><button class="back" id="secBack" aria-label="بازگشت">→</button>' +
    '<h2 style="margin:0">'+esc(sec.title)+"</h2>";
  if(S.sections[sec.id] && S.sections[sec.id].tested) html += ' <span class="badge tested">آزمون‌شده</span>';
  html += "</div>";
  if(!locked){
    html += '<button class="btn sec sm" id="secTestOut" style="margin:6px 0">آزمون سریع بخش (۵ پرسش)</button>';
  }
  sec.steps.forEach((st, i)=>{
    const r = S.steps[st.id];
    const isNext = !r && !sec.steps.slice(0,i).some(x=>!(S.steps[x.id]&&S.steps[x.id].done));
    html += '<div class="node '+(r&&r.done?"done":isNext?"current":"")+'" data-i="'+i+'" role="button" tabindex="0">' +
      '<div class="ic">'+(r&&r.done ? "✓" : secIconSvg(st.type === "teach" ? "book" : st.type === "speak" ? "mic" : "read"))+"</div>" +
      '<div class="tt"><b>'+esc(st.title || ("گام "+(i+1)))+"</b><small>"+(STEP_TYPE_FA[st.type]||"")+"</small></div>" +
      starRow((r&&r.stars)||0) + "</div>";
    if(i < sec.steps.length-1) html += '<div class="connector '+(r&&r.done?"done":"")+'"></div>';
  });
  $app.innerHTML = html;
  document.getElementById("secBack").onclick = ()=> go("home");
  const tb = document.getElementById("secTestOut");
  if(tb) tb.onclick = ()=> startTestOut(sec.id);
  $app.querySelectorAll(".node[data-i]").forEach(n=>{
    const open = ()=>{ round = null; state.round = null; state.stepIdx = +n.dataset.i; go("step"); };
    n.onclick = open;
    n.onkeydown = e=>{ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } };
  });
}
function isSectionLocked(sec){
  const lesson = LESSONS[0];
  const i = lesson.sections.indexOf(sec);
  if(i === 0) return false;
  const prev = lesson.sections[i-1];
  const prevDone = prev.steps.every(x=>S.steps[x.id]&&S.steps[x.id].done) ||
    (S.sections[prev.id] && S.sections[prev.id].done);
  return !prevDone && !(S.sections[sec.id] && S.sections[sec.id].tested);
}

/* ============================================================
   CARDS (Step 5: Again = 1 min, growing intervals)
   ============================================================ */
function renderCards(){
  if(!S.cards.length){
    $app.innerHTML = '<div class="pagehead"><h1>کارت‌ها</h1></div>' +
      '<div class="empty">هنوز کارتی نساخته‌ای.<br>در درس روی کلمه‌ها بزن و به کارت‌ها اضافه کن.</div>';
    return;
  }
  const due = S.cards.filter(c=>c.due <= Date.now());
  const list = (due.length ? due : S.cards).slice(0, 20);
  let i = 0;
  function draw(){
    const c = list[i];
    $app.innerHTML = '<div class="pagehead"><h1>مرور کارت‌ها</h1><p class="sub">'+faNum(i+1)+" از "+faNum(list.length)+" — کل: "+faNum(S.cards.length)+"</p></div>" +
      '<div class="card"><div class="fc" id="fc"><div class="face"><div class="en">'+esc(c.w)+"</div>" +
      '<div class="muted">برای دیدن معنی بزن</div></div>' +
      '<div class="face back" style="display:none"><div class="fa">'+esc(c.fa||"—")+"</div></div></div>" +
      '<div class="row" style="margin-top:12px"><button class="btn no sm" id="again" style="flex:1">دوباره</button>' +
      '<button class="btn ok sm" id="good" style="flex:1">بلدم</button></div>' +
      '<button class="btn sec sm" style="width:100%;margin-top:10px" id="spk">تلفظ</button></div>';
    const fc = document.getElementById("fc"), back = fc.querySelector(".back");
    fc.onclick = ()=> back.style.display = back.style.display === "none" ? "flex" : "none";
    document.getElementById("spk").onclick = ()=> playWordAudio(c.w);
    document.getElementById("again").onclick = ()=>{
      c.box = Math.max(0, c.box-1); c.lapses++; c.due = Date.now() + 60*1000; saveSoon();
      next();
    };
    document.getElementById("good").onclick = ()=>{
      c.box = Math.min(5, c.box+1);
      c.due = Date.now() + [0,10,60,360,1440,4320][c.box]*60*1000;
      addXP(2); saveSoon(); next();
    };
    function next(){ if(i < list.length-1){ i++; draw(); } else { toast("مرور تمام شد"); go("home"); } }
  }
  draw();
}

/* ============================================================
   REVIEW (Step 5): mistake queue + skill practice
   ============================================================ */
function skillAccuracy(skill){
  let n = 0, first = 0;
  LESSONS[0].sections.forEach(sec=> sec.steps.forEach(st=> (st.items||[]).forEach(it=>{
    if((it.skill === skill || (it.slots||[]).some(s=>s.skill === skill)) && S.items[it.id]){
      n++; if(S.items[it.id].first === 1) first++;
    }
  })));
  LESSONS[0].practice.forEach(it=>{
    if(it.skill === skill && S.items[it.id]){ n++; if(S.items[it.id].first === 1) first++; }
  });
  return n ? first/n : -1;   /* -1 = not practiced yet */
}
function itemsBySkill(skill){
  const out = [];
  LESSONS[0].sections.forEach(sec=> sec.steps.forEach(st=> (st.items||[]).forEach(it=>{
    if(it.skill === skill || (it.slots||[]).some(s=>s.skill === skill)) out.push(it);
  })));
  LESSONS[0].practice.forEach(it=>{ if(it.skill === skill) out.push(it); });
  return out;
}
function renderReview(){
  const q = queueItems();
  const allSkills = (LESSONS[0].skills || SKILLS.map(id=>({id,fa:id})));  
  const practiced = allSkills.map(s=>({ id:s.id, fa:s.fa||s.id, acc:skillAccuracy(s.id) }))
    .filter(s=>s.acc >= 0)
    .sort((a,b)=> a.acc - b.acc);
  let html = '<div class="pagehead"><h1>مرور</h1></div>';
  html += q.length
    ? '<div class="card"><p style="font-weight:800">'+faNum(q.length)+' پرسش برای تمرین داری.</p>' +
      '<button class="btn" id="prMist" style="margin-top:10px">تمرین اشتباه‌ها</button></div>'
    : '<div class="card"><p style="font-weight:800">چیزی برای مرور نیست. عالی!</p></div>';
  if(practiced.length){
    html += '<div class="card"><h3>تمرین مهارتی</h3><p class="muted">به ترتیب از کم‌دقت‌ترین مهارت.</p>';
    practiced.slice(0,6).forEach(s=>{
      html += '<div class="skillbar"><div class="srow"><span>'+esc(s.fa)+"</span><span>"+faNum(Math.round(s.acc*100))+"٪</span></div>" +
        '<div class="bar"><i style="width:'+Math.round(s.acc*100)+'%"></i></div>' +
        '<button class="btn sec sm" data-skill="'+s.id+'" style="margin-top:6px">تمرین (۶ پرسش)</button></div>';
    });
    html += "</div>";
  }
  $app.innerHTML = html;
  const pm = document.getElementById("prMist");
  if(pm) pm.onclick = ()=>{
    const ranked = q.map(id=>({id, rec:S.items[id]}))
      .sort((a,b)=> (b.rec.misses - a.rec.misses) || (String(a.rec.last||"").localeCompare(String(b.rec.last||""))))
      .map(x=>x.id).slice(0,8);
    const items = ranked.map(id=> findItemById(id)).filter(Boolean);
    if(!items.length){ toast("پرسش‌ها یافت نشدند"); return; }
    startPracticeRound(items, "practice");
  };
  $app.querySelectorAll("[data-skill]").forEach(b=>{
    b.onclick = ()=>{
      const items = pickN(itemsBySkill(b.dataset.skill), 6);
      if(!items.length){ toast("از این مهارت پرسشی نیست"); return; }
      startPracticeRound(items, "practice");
    };
  });
}
function startPracticeRound(items, label){
  const per = modeCfg().round;
  const chunks = [];
  for(let i=0;i<items.length;i+=per) chunks.push(items.slice(i,i+per));
  round = { items:chunks[0], idx:0, firstOk:0, label,
            exit:()=>{ round = null; state.round = null; go("review"); } };
  if(chunks.length > 1) round.more = chunks;
  state.round = round;
  go("step");
}
function findItemById(id){
  for(const sec of LESSONS[0].sections)
    for(const st of sec.steps){
      for(const it of (st.items||[])) if(it.id === id) return it;
      if(st.blanks) st.blanks.forEach(b=>{ if(b.id === id) {} });
    }
  for(const it of LESSONS[0].practice) if(it.id === id) return it;
  return null;
}

/* ============================================================
   STATS / PROGRESS (Step 5): per-skill bars + stars per step
   ============================================================ */
function renderStats(){
  const lesson = LESSONS[0];
  const total = lesson.sections.reduce((n,s)=>n+s.steps.length,0);
  const doneN = lesson.sections.reduce((n,s)=>n+s.steps.filter(x=>S.steps[x.id]&&S.steps[x.id].done).length,0);
  const pct = total ? Math.round(doneN/total*100) : 0;
  const skills = (lesson.skills || []).map(s=>({id:s.id, fa:s.fa||s.id, acc:skillAccuracy(s.id)}))
    .filter(s=>s.acc >= 0).sort((a,b)=> b.acc - a.acc);
  let html = '<div class="pagehead"><h1>پیشرفت من</h1></div>' +
    '<div class="card"><div style="display:flex;gap:18px;text-align:center;margin:6px 0">' +
    '<div style="flex:1"><b style="font-size:22px">'+faNum(S.xp)+"</b><div class='muted'>امتیاز</div></div>" +
    '<div style="flex:1"><b style="font-size:22px">'+faNum(S.streak.count)+"</b><div class='muted'>روز پیوسته</div></div>" +
    '<div style="flex:1"><b style="font-size:22px">'+faNum(S.cards.length)+"</b><div class='muted'>کارت</div></div></div></div>" +
    '<div class="card"><h3>پیشرفت درس ۱</h3><div class="bar" style="height:14px"><i style="width:'+pct+'%"></i></div>' +
    '<p class="muted">'+faNum(doneN)+" از "+faNum(total)+" گام ("+faNum(pct)+"٪)</p></div>";
  if(skills.length){
    html += '<div class="card"><h3>دقت مهارت‌ها</h3>';
    skills.forEach(s=>{
      html += '<div class="skillbar"><div class="srow"><span>'+esc(s.fa)+"</span><span>"+faNum(Math.round(s.acc*100))+"٪</span></div>" +
        '<div class="bar"><i style="width:'+Math.round(s.acc*100)+'%"></i></div></div>';
    });
    html += "</div>";
  }
  /* stars per step, per section */
  html += '<div class="card"><h3>ستاره‌های گام‌ها</h3>';
  lesson.sections.forEach(sec=>{
    const stars = sec.steps.reduce((n,x)=> n + ((S.steps[x.id]&&S.steps[x.id].stars)||0), 0);
    html += '<div class="srow" style="display:flex;justify-content:space-between;font-weight:700;margin:6px 0">' +
      '<span>'+esc(sec.title)+"</span><span>"+faNum(stars)+" / "+faNum(sec.steps.length*3)+" ★</span></div>";
  });
  html += "</div>";
  /* student settings (Step 1): dark, sound, mode, text size only */
  html += '<div class="card"><h3>تنظیمات</h3>' +
    '<div class="row" style="margin:8px 0"><button class="btn sec sm" id="setTheme" style="flex:1">حالت شب/روز</button>' +
    '<button class="btn sec sm" id="setSound" style="flex:1">صدا: '+(S.sound?"روشن":"خاموش")+"</button></div>" +
    '<p class="progress-label">اندازهٔ متن</p><div class="seg sm" id="tsSeg">' +
    ["کوچک","معمولی","بزرگ"].map((t,k)=>'<button data-ts="'+(k)+'" class="'+(S.textSize===k?"on":"")+'">'+t+"</button>").join("") + "</div>" +
    '<p class="progress-label">حالت مطالعه</p><div class="seg sm" id="mSeg">' +
    Object.keys(MODES).map(m=>'<button data-mode="'+m+'" class="'+(S.mode===m?"on":"")+'">'+MODES[m].fa+"</button>").join("") + "</div></div>";
  /* reset via in-app dialog (Step 1) */
  html += '<div class="card"><button class="btn no" id="resetBtn">پاک کردن همهٔ پیشرفت</button></div>';
  $app.innerHTML = html;
  /* textSize applies via html attribute */
  applyTextSize();
  document.getElementById("setTheme").onclick = ()=>{
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    saveSoon();
  };
  document.getElementById("setSound").onclick = e=>{
    S.sound = !S.sound; saveSoon(); e.target.textContent = "صدا: "+(S.sound?"روشن":"خاموش");
  };
  document.getElementById("tsSeg").querySelectorAll("button").forEach(b=>{
    b.onclick = ()=>{ S.textSize = +b.dataset.ts; saveSoon(); applyTextSize();
      document.getElementById("tsSeg").querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b)); };
  });
  document.getElementById("mSeg").querySelectorAll("button").forEach(b=>{
    b.onclick = ()=>{ S.mode = b.dataset.mode; saveSoon(); syncModeUI();
      document.getElementById("mSeg").querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b)); };
  });
  document.getElementById("resetBtn").onclick = ()=>{
    confirmDlg("پاک کردن پیشرفت", "همهٔ پیشرفت تو پاک می‌شود. مطمئنی؟", "پاک کن", "انصراف", ()=>{
      localStorage.removeItem(STORE_KEY);
      S = JSON.parse(JSON.stringify(DEFAULT));
      save(); go("home");
    });
  };
}
function applyTextSize(){
  document.documentElement.style.fontSize = (16 + (S.textSize||1)*1) + "px";
}

/* ============ TEACHER placeholder (Step 13 later) ============ */
/* audio base / reset / export intentionally NOT exposed to students (Step 1). */

/* ============ BOOT ============ */
applyTextSize();
touchStreak(); saveSoon();
loadAudioManifest().then(()=>{
  if(isFirstRun()) renderFirstRun(1);
  else go("home");
});
if("serviceWorker" in navigator && location.protocol !== "file:"){
  window.addEventListener("load", ()=> navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

})();
