(function(){
"use strict";

/* ============ DATA ============ */
const GLOSSARY = window.__GLOSSARY__ || {};
const AUDIO_MAP = window.__AUDIO__ || {};
const LESSONS = window.__LESSONS__ || [];
const STORE_KEY = "eng2_v2";

/* ============ STATE ============ */
const DEFAULT = { xp:0, hearts:5, maxHearts:5, streak:0, lastDay:null, lastHeartTs:Date.now(),
  theme:"light", audioBase:"", done:{}, cards:[], wrong:[], secDone:{} };
let S = load();
function load(){ try{ const r = JSON.parse(localStorage.getItem(STORE_KEY)); if(r) return Object.assign({}, DEFAULT, r); }catch(e){} return JSON.parse(JSON.stringify(DEFAULT)); }
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }catch(e){} }
function today(){ return new Date().toISOString().slice(0,10); }

function regenHearts(){
  if(S.hearts >= S.maxHearts){ S.lastHeartTs = Date.now(); return; }
  const gain = Math.floor((Date.now()-S.lastHeartTs)/60000/8);
  if(gain>0){ S.hearts = Math.min(S.maxHearts, S.hearts+gain); S.lastHeartTs = Date.now(); save(); }
}
function addXP(n){ S.xp += n; save(); paintHUD(); }
function loseHeart(){
  const was = S.hearts;
  S.hearts = Math.max(0, S.hearts-1);
  if(was > 0 && S.hearts === 0) S.lastHeartTs = Date.now();
  save(); paintHUD();
}
let lastStreakToast = 0;
function touchStreak(){
  const t = today();
  if(S.lastDay === t) return;
  const y = new Date(Date.now()-864e5).toISOString().slice(0,10);
  S.streak = (S.lastDay === y) ? S.streak+1 : 1;
  S.lastDay = t; save(); paintHUD();
  if(Date.now() - lastStreakToast > 60000){ lastStreakToast = Date.now(); toast("🔥 روز پیوسته: " + S.streak); }
}

/* ============ DOM ============ */
const $app = document.getElementById("app");
const $overlay = document.getElementById("overlay");
const $sheetBody = document.getElementById("sheetBody");
const $sheetClose = document.getElementById("sheetClose");
const $topbar = document.getElementById("topbar");
const $tbBar = document.getElementById("tbBar");
const $tbHearts = document.getElementById("tbHearts");
const $fbSheet = document.getElementById("fbSheet");
const $fbMsg = document.getElementById("fbMsg");
const $fbEx = document.getElementById("fbEx");
const $fbBtn = document.getElementById("fbBtn");

function paintHUD(){
  document.getElementById("hXp").textContent = "⭐ " + S.xp;
  document.getElementById("hHeart").textContent = "❤️ " + S.hearts;
  document.getElementById("hStreak").textContent = "🔥 " + S.streak;
  $tbHearts.textContent = "❤️ " + S.hearts;
}
function applyTheme(){ document.documentElement.dataset.theme = S.theme;
  document.getElementById("btnTheme").textContent = S.theme==="dark" ? "☀️" : "🌙"; }
document.getElementById("btnTheme").onclick = ()=>{ S.theme = S.theme==="dark"?"light":"dark"; save(); applyTheme(); };

function esc(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function toast(m){ const t=document.getElementById("toast"); const d=document.createElement("div");
  d.textContent=m; t.appendChild(d); setTimeout(()=>d.remove(), 1800); }
function closeSheet(){ $overlay.classList.remove("show"); }
$overlay.onclick = e=>{ if(e.target===$overlay) closeSheet(); };
$sheetClose.onclick = closeSheet;
function openSheet(html){ $sheetBody.innerHTML = html; $overlay.classList.add("show"); }

/* ============ SOUND EFFECTS (WebAudio, no files) ============ */
let audioCtx = null;
function ctx(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
function tone(freq, dur, type, gain){
  try{
    const c = ctx(); const o = c.createOscillator(); const g = c.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(gain || 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }catch(e){}
}
function playCorrect(){ tone(660, 0.12, "sine", 0.14); setTimeout(()=>tone(880, 0.18, "sine", 0.14), 90); }
function playWrong(){ tone(220, 0.22, "sine", 0.13); setTimeout(()=>tone(165, 0.28, "sine", 0.13), 90); }

/* ============ AUDIO SPEAKING ============ */
function audioPath(id){
  if(!id) return null;
  if(AUDIO_MAP[id]) return AUDIO_MAP[id];
  if(S.audioBase) return String(S.audioBase).replace(/\/+$/,"") + "/" + id + ".mp3";
  return null;
}
function speakId(id, fallbackText){
  const path = audioPath(id);
  if(path){
    const a = new Audio(path);
    a.play().catch(()=> tts(fallbackText));
    return;
  }
  if(fallbackText) tts(fallbackText);
}
function speak(text){ tts(text); }
function tts(text){
  if(!text || !("speechSynthesis" in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.88; u.pitch = 1;
    const v = speechSynthesis.getVoices().find(x=>/en-(US|GB)/i.test(x.lang));
    if(v) u.voice = v;
    speechSynthesis.speak(u);
  }catch(e){}
}
function speakItem(item){
  if(typeof item === "string"){ speak(item); return; }
  speakId(item.audioId, item.en || item.sentence || item.t || "");
}
if("speechSynthesis" in window) speechSynthesis.onvoiceschanged = ()=>{};

/* ============ TAPPABLE WORDS ============ */
let clickTimer = null;
function cssEscape(s){ if(window.CSS && CSS.escape) return CSS.escape(s); return String(s).replace(/[^a-zA-Z0-9_\-]/g, ch=>"\\"+ch); }
function tap(sentence, fa){
  const toks = String(sentence).split(/(\s+)/);
  const inner = toks.map(t=>{
    if(/^\s+$/.test(t)) return t;
    const key = t.replace(/[^A-Za-z'\-]/g,"").toLowerCase();
    if(!key) return esc(t);
    const seen = S.cards.some(c=>c.w===key) ? " seen":"";
    return `<span class="w${seen}" data-w="${esc(key)}">${esc(t)}</span>`;
  }).join("");
  return `<span class="sent ltr" dir="ltr" data-fa="${esc(fa||"")}">${inner}</span>`;
}
function wordPopup(w){
  const fa = GLOSSARY[w];
  const has = S.cards.some(c=>c.w===w);
  openSheet(`
    <h3 class="ltr" style="text-align:center;font-size:26px;font-weight:800">${esc(w)}</h3>
    <p style="text-align:center;font-size:20px;font-weight:700;color:var(--blue);margin:10px 0">
      ${esc(fa || "— معنی در واژه‌نامه ثبت نشده —")}
    </p>
    <div class="row" style="margin-top:16px">
      <button class="btn blue sm" style="flex:1" id="spkWord">🔊 تلفظ</button>
      <button class="btn ${has?'sec':''} sm" style="flex:1" id="addCard" ${has?'disabled':''}>
        ${has?"✓ در کارت‌ها":"➕ افزودن"}
      </button>
    </div>`);
  document.getElementById("spkWord").onclick = ()=> speak(w);
  const b = document.getElementById("addCard");
  if(b && !has){ b.onclick = ()=>{
    S.cards.push({w, fa:fa||"", box:0, due:Date.now(), lapses:0}); save(); addXP(1);
    b.textContent = "✓ در کارت‌ها"; b.disabled = true;
    document.querySelectorAll('.w[data-w="'+cssEscape(w)+'"]').forEach(e=>e.classList.add("seen"));
  }; }
}
function sentencePopup(el){
  const fa = el.dataset.fa; const en = el.textContent;
  openSheet(`
    <p class="ltr" dir="ltr" style="font-size:17px;font-weight:600;line-height:2;text-align:left">${esc(en)}</p>
    <hr style="border:none;border-top:1px dashed var(--line);margin:14px 0">
    <p style="font-size:16px;font-weight:700;color:var(--blue);line-height:2;direction:rtl">
      ${esc(fa || "— ترجمه ثبت نشده —")}</p>
    <button class="btn blue sm" style="width:100%;margin-top:14px" id="spkSent">🔊 پخش جمله</button>`);
  document.getElementById("spkSent").onclick = ()=> speak(en);
}
document.addEventListener("click", e=>{
  if(e.target.closest("#sheet") || e.target.closest("#fbSheet")) return;
  const w = e.target.closest(".w");
  if(w){
    if(clickTimer){ clearTimeout(clickTimer); clickTimer=null; return; }
    clickTimer = setTimeout(()=>{ clickTimer=null; wordPopup(w.dataset.w); }, 230);
  }
});
let lastTap = 0, lastTapTarget = null;
document.addEventListener("touchend", e=>{
  if(e.target.closest("#sheet") || e.target.closest("#fbSheet")) return;
  const s = e.target.closest(".sent"); if(!s) return;
  const now = Date.now();
  if(now - lastTap < 320 && lastTapTarget === s){
    if(clickTimer){ clearTimeout(clickTimer); clickTimer=null; }
    sentencePopup(s); lastTap=0; lastTapTarget=null; e.preventDefault();
  } else { lastTap=now; lastTapTarget=s; }
}, {passive:false});
document.addEventListener("dblclick", e=>{
  if(e.target.closest("#sheet") || e.target.closest("#fbSheet")) return;
  const s = e.target.closest(".sent");
  if(s){ if(clickTimer){clearTimeout(clickTimer);clickTimer=null;} sentencePopup(s); }
});

/* ============ FEEDBACK SHEET ============ */
let fbResolve = null;
function feedback(ok, ex, continueLabel, onContinue){
  if(ok) playCorrect(); else playWrong();
  if(!ok) loseHeart();
  $fbSheet.classList.remove("ok","no");
  $fbSheet.classList.add("show", ok ? "ok" : "no");
  $fbMsg.textContent = ok ? "✅ درست!" : "❌ نادرست";
  $fbEx.textContent = ex || "";
  $fbBtn.textContent = continueLabel || "ادامه";
  const token = renderToken;
  fbResolve = ()=>{
    $fbSheet.classList.remove("show");
    setTimeout(()=>{ if(onContinue && token === renderToken) onContinue(); fbResolve = null; }, 200);
  };
}
$fbBtn.onclick = ()=>{ if(fbResolve) fbResolve(); };

/* ============ TOP BAR ============ */
function showTopBar(show){ $topbar.style.display = show ? "flex" : "none"; }
function setTopProgress(pct){ $tbBar.style.width = Math.round(pct*100) + "%"; }
document.getElementById("tbClose").onclick = ()=>{
  if($fbSheet.classList.contains("show")){ $fbSheet.classList.remove("show"); fbResolve = null; }
  if(!state.section) return go("map");
  go("section",{sectionId:state.section.id});
};

/* ============ NAV / ROUTER ============ */
const state = { lesson:null, section:null, stepIdx:0, steps:[] };
let stepCleanup = null;
let renderToken = 0;
function go(view, params){
  renderToken++;
  if(stepCleanup){ try{ stepCleanup(); }catch(e){} stepCleanup = null; }
  window.scrollTo({top:0, behavior:"instant"});
  showTopBar(view === "step");
  if(view==="map") renderMap();
  else if(view==="cards") renderCards();
  else if(view==="review") renderReview();
  else if(view==="stats") renderStats();
  else if(view==="section") renderSection(params.sectionId);
  else if(view==="step") renderStep();
}
document.querySelectorAll("nav.bottom button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll("nav.bottom button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); go(b.dataset.nav);
  };
});

/* ============ MAP ============ */
function sectionProgress(sec){
  const t = sec.steps.length;
  const d = sec.steps.filter(st=>S.done[st.id]).length;
  return t ? d/t : 0;
}
function renderMap(){
  const lesson = LESSONS[0]; state.lesson = lesson;
  let html = `<h1 class="page">درس ۱ — ${esc(lesson.title)}</h1>
    <p class="muted ltr" dir="ltr" style="text-align:left">${esc(lesson.en)}</p>
    <div style="margin-top:18px">`;
  lesson.sections.forEach((sec,i)=>{
    const p = sectionProgress(sec); const done = p>=1;
    const prevDone = i===0 ? true : sectionProgress(lesson.sections[i-1])>=1;
    const locked = !prevDone && p===0;
    html += `<div class="node ${done?'done':''} ${locked?'locked':''}" data-sec="${sec.id}">
        <div class="ic">${done?"✓":sec.icon}</div>
        <div class="tt"><b>${esc(sec.title)}</b>
          <small>${sec.steps.length} بخش ${locked?"— قفل":(done?"— کامل":"")}</small>
          <div class="bar"><i style="width:${Math.round(p*100)}%"></i></div>
        </div></div>`;
    if(i < lesson.sections.length-1) html += `<div class="connector ${done?'done':''}"></div>`;
  });
  html += `</div>`;
  if(LESSONS[1]){
    html += `<div class="node locked" style="margin-top:18px"><div class="ic">${esc(LESSONS[1].icon||"📘")}</div>
      <div class="tt"><b>درس ۲ — ${esc(LESSONS[1].title)}</b><small>به‌زودی</small></div></div>`;
  }
  $app.innerHTML = html;
  $app.querySelectorAll(".node[data-sec]").forEach(n=>{
    if(n.classList.contains("locked")) return;
    n.onclick = ()=> go("section",{sectionId:n.dataset.sec});
  });
}

/* ============ SECTION ============ */
function renderSection(sectionId){
  const sec = state.lesson.sections.find(s=>s.id===sectionId);
  if(!sec) return go("map");
  state.section = sec; state.steps = sec.steps;
  let html = `<div class="toprow">
      <button class="back" data-go="map">←</button>
      <h2 style="margin:0">${sec.icon} ${esc(sec.title)}</h2>
    </div>`;
  sec.steps.forEach((st,i)=>{
    const d = S.done[st.id];
    html += `<div class="node ${d?'done':''}" data-i="${i}">
        <div class="ic">${d?"✓":(i+1)}</div>
        <div class="tt"><b>${esc(st.title||("بخش "+(i+1)))}</b>
          <small>${typeLabel(st.type)}</small></div>
      </div><div class="connector ${d?'done':''}"></div>`;
  });
  $app.innerHTML = html;
  $app.querySelector("[data-go]").onclick = ()=> go("map");
  $app.querySelectorAll(".node[data-i]").forEach(n=>{
    n.onclick = ()=>{ state.stepIdx = +n.dataset.i; go("step"); };
  });
}
function typeLabel(t){
  return ({intro:"مقدمه",mcq:"تمرین",mcqset:"مجموعه تمرین",match:"تطبیق",pic_match:"تطبیق تصویری",
    flashcards:"کارت‌ها",reorder:"مرتب‌سازی",sort:"دسته‌بندی",wordbuild:"ساخت معنی",
    dialog_reveal:"مکالمه",listen_mcq:"شنیداری",speak:"گفتاری",teach:"آموزش",
    reading:"متن",roleplay:"نقش‌آفرینی",pic_choice:"انتخاب تصویر",
    skim_scan:"خواندن سریع و اسکن"})[t] || "";
}

/* ============ STEP ============ */
function renderStep(){
  const st = state.steps[state.stepIdx];
  if(!st) return go("map");
  setTopProgress(state.stepIdx / state.steps.length);
  const R = ({intro:rIntro, mcq:rMcq, mcqset:rMcqSet, match:rMatch, pic_match:rPicMatch,
    flashcards:rFlashcards, reorder:rReorder, sort:rSort, wordbuild:rWordBuild,
    dialog_reveal:rDialogReveal, listen_mcq:rListenMcq, speak:rSpeak, teach:rTeach,
    reading:rReading, roleplay:rRoleplay, pic_choice:rPicChoice, skim_scan:rSkimScan})[st.type];
  if(!R) return go("map");
  $app.innerHTML = `
    <div class="toprow">
      <button class="back" data-go="section">←</button>
      <h2 style="margin:0;font-size:16px">${esc(st.title||"")}</h2>
      <span class="spacer" style="flex:1"></span>
      <span class="muted" style="font-size:12px">${state.stepIdx+1}/${state.steps.length}</span>
    </div>
    <div id="stage"></div>
    <div id="stepFoot" style="margin-top:20px;margin-bottom:20px"></div>`;
  $app.querySelector("[data-go]").onclick = ()=> go("section",{sectionId:state.section.id});
  try { R(st, document.getElementById("stage")); }
  catch(err){
    console.error("Step render error", st.id, err);
    document.getElementById("stage").innerHTML =
      `<div class="card"><p class="muted">خطا در نمایش این بخش: ${esc(err.message)}</p></div>`;
    nextBtn("رد کردن");
  }
}
function finishStep(){
  const st = state.steps[state.stepIdx];
  S.done[st.id] = true; save(); touchStreak();
  if(state.steps.every(x=>S.done[x.id])) S.secDone[state.section.id] = true;
  save();
  if(state.stepIdx < state.steps.length-1){ state.stepIdx++; go("step"); }
  else { go("section",{sectionId:state.section.id}); toast("بخش کامل شد! 🎉"); }
}
function nextBtn(label){
  const f = document.getElementById("stepFoot");
  f.innerHTML = `<button class="btn" id="nx">${label||"ادامه"}</button>`;
  document.getElementById("nx").onclick = finishStep;
}

/* ============ RENDERERS ============ */

/* INTRO */
function rIntro(st, el){
  el.innerHTML = `<div class="card" style="text-align:center;padding:36px 20px">
      <div style="font-size:64px;margin-bottom:12px">${state.section.icon}</div>
      <h2 style="font-size:22px">${esc(st.title)}</h2>
      <p class="muted" style="font-size:15px;line-height:1.9">${esc(st.body)}</p></div>`;
  nextBtn(st.cta||"شروع");
}

/* FLASHCARDS */
function rFlashcards(st, el){
  let i = 0;
  function draw(){
    const w = st.words[i];
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="display:flex;justify-content:space-between;font-size:13px;color:var(--tx2);font-weight:700">
        <span>کارت ${i+1} از ${st.words.length}</span>
        <button class="btn blue sm" id="spk" style="padding:6px 12px">🔊</button>
      </div>
      <div class="fc" id="fc"><div class="inner">
        <div class="face">
          <div style="font-size:56px">${w.em||"📘"}</div>
          <div class="en">${esc(w.w)}</div>
          <div class="muted" style="font-size:13px">برای دیدن معنی، کارت را بزن</div>
        </div>
        <div class="face back">
          <div class="fa" style="font-size:26px">${esc(w.fa)}</div>
          ${w.ex?`<div class="muted ltr" dir="ltr" style="font-size:13px;margin-top:6px">${esc(w.ex)}</div>`:""}
        </div>
      </div></div>
      <div class="row" style="margin-top:14px">
        <button class="btn sec sm" style="flex:1" id="add">➕ افزودن</button>
        <button class="btn sm" style="flex:1" id="nxt">${i<st.words.length-1?"بعدی":"پایان"}</button>
      </div></div>`;
    const fc = document.getElementById("fc");
    fc.onclick = ()=> fc.classList.toggle("flip");
    document.getElementById("spk").onclick = e=>{ e.stopPropagation(); speakItem(w); };
    const add = document.getElementById("add");
    add.onclick = ()=>{
      const key = w.w.toLowerCase();
      if(!S.cards.some(c=>c.w===key)){
        S.cards.push({w:key, fa:w.fa, box:0, due:Date.now(), lapses:0});
        save(); addXP(1); add.textContent="✓ اضافه شد"; add.disabled = true;
      }
    };
    document.getElementById("nxt").onclick = ()=>{
      if(i < st.words.length-1){ i++; draw(); } else finishStep();
    };
  }
  draw();
}

/* MCQ */
function rMcq(st, el){
  el.innerHTML = `<div class="card">
      <p class="q ltr" dir="ltr" style="text-align:left">${esc(st.q)}</p>
      ${st.qFa?`<p class="muted" style="margin-top:-4px">${esc(st.qFa)}</p>`:""}
      <div id="opts" style="margin-top:12px"></div></div>`;
  const box = document.getElementById("opts");
  let answered = false, wrongTries = 0;
  const opts = st.opts.map((o,i)=>({o, i}));
  // shuffle
  opts.sort(()=>Math.random()-.5);
  const correctIdx = opts.findIndex(x=>x.i === st.ans);
  opts.forEach(({o, i}, pos)=>{
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = `<span class="key">${"ABCD"[pos]}</span><span class="ltr" dir="ltr">${esc(o)}</span>`;
    b.onclick = ()=> answer(pos);
    box.appendChild(b);
  });
  function answer(pos){
    if(answered) return;
    const ok = pos === correctIdx;
    if(ok){
      answered = true;
      [...box.children].forEach((c,k)=>{ c.classList.add("dis");
        if(k===correctIdx) c.classList.add("ok");
        else if(k===pos) c.classList.add("no"); });
      if(wrongTries < 2){ addXP(5); }
      feedback(true, st.ex, "ادامه", finishStep);
    } else {
      wrongTries++;
      box.children[pos].classList.add("no");
      if(wrongTries >= 2){
        answered = true;
        [...box.children].forEach((c,k)=>{ c.classList.add("dis");
          if(k===correctIdx) c.classList.add("ok"); });
        S.wrong.push({key:st.id, ts:Date.now()}); save();
        feedback(false, "دو بار اشتباه. جواب درست را دیدی. " + (st.ex||""), "ادامه", finishStep);
      } else {
        playWrong(); loseHeart();
        box.children[pos].classList.add("dis");
        toast("❌ دوباره تلاش کن");
      }
    }
  }
}

/* MCQ SET */
function rMcqSet(st, el){
  const items = st.items.map(it=>{
    const order = it.opts.map((_,i)=>i).sort(()=>Math.random()-.5);
    return { ...it, _order: order, _ansIdx: order.indexOf(it.ans) };
  });
  let i = 0;
  function draw(){
    const it = items[i];
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="display:flex;justify-content:space-between;font-size:13px;color:var(--tx2);font-weight:700">
        <span>سؤال ${i+1} از ${items.length}</span>
        <div class="bar" style="width:60%"><i style="width:${(i/items.length)*100}%"></i></div>
      </div>
      ${it.emoji?`<div style="text-align:center;font-size:64px;margin:10px 0">${it.emoji}</div>`:""}
      <p class="q ltr" dir="ltr" style="text-align:left">${esc(it.q)}</p>
      ${it.qFa?`<p class="muted" style="margin-top:-4px">${esc(it.qFa)}</p>`:""}
      <div id="opts" style="margin-top:12px"></div></div>`;
    const box = document.getElementById("opts");
    let answered = false, wrongTries = 0;
    it._order.forEach((origIdx, pos)=>{
      const b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = `<span class="key">${"ABCD"[pos]}</span><span class="ltr" dir="ltr">${esc(it.opts[origIdx])}</span>`;
      b.onclick = ()=> answer(pos);
      box.appendChild(b);
    });
    function answer(pos){
      if(answered) return;
      const ok = pos === it._ansIdx;
      if(ok){
        answered = true;
        [...box.children].forEach((c,k)=>{ c.classList.add("dis");
          if(k===it._ansIdx) c.classList.add("ok"); else if(k===pos) c.classList.add("no"); });
        if(wrongTries < 2){ addXP(5); }
        const last = i === items.length-1;
        feedback(true, it.ex, last?"پایان":"سؤال بعدی", ()=>{
          if(last) finishStep();
          else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
        });
      } else {
        wrongTries++;
        box.children[pos].classList.add("no");
        if(wrongTries >= 2){
          answered = true;
          [...box.children].forEach((c,k)=>{ c.classList.add("dis");
            if(k===it._ansIdx) c.classList.add("ok"); });
          S.wrong.push({key:st.id+"_"+i, ts:Date.now()}); save();
          const last = i === items.length-1;
          feedback(false, "دو بار اشتباه. " + (it.ex||""), last?"پایان":"سؤال بعدی", ()=>{
            if(last) finishStep();
            else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
          });
        } else {
          playWrong(); loseHeart();
          box.children[pos].classList.add("dis");
          toast("❌ دوباره تلاش کن");
        }
      }
    }
  }
  draw();
}

/* MATCH (word → meaning) */
function rMatch(st, el){
  const left = st.left.map((x,i)=>({...x, id:i}));
  const right = st.right.map((t,i)=>({t, id:i})).sort(()=>Math.random()-.5);
  let selL = null, matched = 0, errors = 0;
  el.innerHTML = `<div class="card">
      <p class="muted" style="margin-top:0">${esc(st.tip||"روی یک مورد از ستون راست بزن، سپس معادلش را در ستون چپ انتخاب کن.")}</p>
      <div class="mgrid" style="margin-top:12px">
        <div class="mcol" id="cL"></div>
        <div class="mcol" id="cR"></div>
      </div></div>`;
  const cL = document.getElementById("cL"), cR = document.getElementById("cR");
  left.forEach(x=>{
    const d = document.createElement("button");
    d.className = "mitem";
    d.innerHTML = x.em?`<span class="em">${x.em}</span><span class="ltr" dir="ltr">${esc(x.txt)}</span>`
                     :`<span class="ltr" dir="ltr">${esc(x.txt)}</span>`;
    d.dataset.id = x.id;
    d.onclick = ()=> pickL(d);
    cL.appendChild(d);
  });
  right.forEach(x=>{
    const d = document.createElement("button");
    d.className = "mitem";
    d.innerHTML = `<span style="direction:rtl">${esc(x.t)}</span>`;
    d.dataset.id = x.id;
    d.onclick = ()=> pickR(d);
    cR.appendChild(d);
  });
  function pickL(d){
    if(d.classList.contains("ok")) return;
    cL.querySelectorAll(".mitem").forEach(e=>e.classList.remove("sel"));
    d.classList.add("sel"); selL = d;
  }
  function pickR(d){
    if(d.classList.contains("ok") || !selL) return;
    const l = +selL.dataset.id, r = +d.dataset.id;
    if(l === r){
      selL.classList.remove("sel"); selL.classList.add("ok");
      d.classList.add("ok"); matched++; addXP(3); playCorrect();
      if(matched === left.length){
        setTimeout(()=>{ feedback(true, "همه را درست مطابقت دادی!", "ادامه", finishStep); }, 250);
      }
      selL = null;
    } else {
      errors++; loseHeart(); playWrong();
      d.classList.add("no"); setTimeout(()=>d.classList.remove("no"),400);
      selL.classList.remove("sel"); selL = null;
    }
  }
}

/* PIC CHOICE */
function rPicChoice(st, el){
  let i = 0;
  function draw(){
    const it = st.items[i];
    const allOpts = [it.sentence, ...it.distractors].sort(()=>Math.random()-.5);
    const correctIdx = allOpts.indexOf(it.sentence);
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="display:flex;justify-content:space-between;font-size:13px;color:var(--tx2);font-weight:700">
        <span>${i+1} از ${st.items.length}</span>
        <div class="bar" style="width:60%"><i style="width:${(i/st.items.length)*100}%"></i></div>
      </div>
      ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
      <div style="text-align:center;font-size:80px;margin:16px 0">${it.emoji}</div>
      <div id="opts"></div></div>`;
    const box = document.getElementById("opts");
    let answered = false, wrongTries = 0;
    allOpts.forEach((o, pos)=>{
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "stretch";
      const b = document.createElement("button");
      b.className = "opt";
      b.style.flex = "1";
      b.innerHTML = `<span class="key">${"ABCD"[pos]}</span><span class="ltr" dir="ltr">${esc(o)}</span>`;
      b.onclick = ()=> answer(pos);
      row.appendChild(b);
      // audio button for each option
      const sp = document.createElement("button");
      sp.className = "btn blue sm";
      sp.style.padding = "8px 12px";
      sp.textContent = "🔊";
      sp.onclick = e=>{ e.stopPropagation(); speak(o); };
      row.appendChild(sp);
      box.appendChild(row);
    });
    function answer(pos){
      if(answered) return;
      const ok = pos === correctIdx;
      if(ok){
        answered = true;
        [...box.children].forEach((row,k)=>{ row.children[0].classList.add("dis");
          if(k===correctIdx) row.children[0].classList.add("ok");
          else if(k===pos) row.children[0].classList.add("no"); });
        if(wrongTries < 2) addXP(5);
        const last = i === st.items.length-1;
        feedback(true, it.ex, last?"پایان":"بعدی", ()=>{
          if(last) finishStep();
          else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
        });
      } else {
        wrongTries++;
        box.children[pos].children[0].classList.add("no");
        if(wrongTries >= 2){
          answered = true;
          [...box.children].forEach((row,k)=>{ row.children[0].classList.add("dis");
            if(k===correctIdx) row.children[0].classList.add("ok"); });
          S.wrong.push({key:st.id+"_"+i, ts:Date.now()}); save();
          const last = i === st.items.length-1;
          feedback(false, "دو بار اشتباه. " + (it.ex||""), last?"پایان":"بعدی", ()=>{
            if(last) finishStep();
            else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
          });
        } else {
          playWrong(); loseHeart();
          box.children[pos].children[0].classList.add("dis");
          toast("❌ دوباره تلاش کن");
        }
      }
    }
  }
  draw();
}

/* PIC MATCH — image → phrase */
function rPicMatch(st, el){
  let i = 0;
  function draw(){
    const it = st.items[i];
    const others = st.items.filter((_,k)=>k!==i).map(x=>x.sentence);
    const all = [it.sentence, ...others].sort(()=>Math.random()-.5);
    const correctIdx = all.indexOf(it.sentence);
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="font-size:13px;color:var(--tx2);font-weight:700">${i+1} از ${st.items.length}</div>
      ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
      <div style="text-align:center;font-size:80px;margin:16px 0">${it.emoji}</div>
      <div id="opts"></div></div>`;
    const box = document.getElementById("opts");
    let answered = false, wrongTries = 0;
    all.forEach((o,pos)=>{
      const b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = `<span class="key">${"ABCD"[pos]}</span><span class="ltr" dir="ltr">${esc(o)}</span>`;
      b.onclick = ()=>{
        if(answered) return;
        const ok = pos === correctIdx;
        if(ok){
          answered = true;
          [...box.children].forEach((c,k)=>{ c.classList.add("dis");
            if(k===correctIdx) c.classList.add("ok"); else if(k===pos) c.classList.add("no"); });
          addXP(4);
          const last = i === st.items.length-1;
          feedback(true, `${it.sentence} = ${it.fa}`, last?"پایان":"بعدی", ()=>{
            if(last) finishStep();
            else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
          });
        } else {
          wrongTries++;
          box.children[pos].classList.add("no");
          if(wrongTries >= 2){
            answered = true;
            [...box.children].forEach((c,k)=>{ c.classList.add("dis");
              if(k===correctIdx) c.classList.add("ok"); });
            feedback(false, "جواب درست: " + it.sentence + " = " + it.fa, i===st.items.length-1?"پایان":"بعدی", ()=>{
              if(i===st.items.length-1) finishStep();
              else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
            });
          } else {
            playWrong(); loseHeart();
            box.children[pos].classList.add("dis");
            toast("❌ دوباره تلاش کن");
          }
        }
      };
      box.appendChild(b);
    });
  }
  draw();
}

/* REORDER */
function rReorder(st, el){
  let i = 0;
  function draw(){
    const it = st.items[i];
    const shuffled = [...it.words].sort(()=>Math.random()-.5);
    let built = [];
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="font-size:13px;color:var(--tx2);font-weight:700">جمله ${i+1} از ${st.items.length}</div>
      <p class="muted">کلمه‌ها را به ترتیب درست بچین.</p>
      <div class="chips" id="built" style="min-height:56px"></div>
      <div class="chips" id="pool"></div>
      <div class="row" style="margin-top:8px">
        <button class="btn sec sm" style="flex:1" id="undo">↩︎ حذف</button>
        <button class="btn sm" style="flex:1" id="check">بررسی</button>
      </div></div>`;
    const pool = document.getElementById("pool");
    shuffled.forEach(w=>{
      const c = document.createElement("button");
      c.className = "chip"; c.textContent = w;
      c.onclick = ()=>{ if(c.classList.contains("used")) return;
        built.push({word:w, chip:c}); c.classList.add("used"); paint(); };
      pool.appendChild(c);
    });
    function paint(){
      const b = document.getElementById("built");
      b.innerHTML = built.map((x,k)=>
        `<span class="chip picked" data-k="${k}">${esc(x.word)}</span>`).join("");
      b.querySelectorAll("[data-k]").forEach(x=>{
        x.onclick = ()=>{ const k = +x.dataset.k; const item = built[k];
          if(!item) return; item.chip.classList.remove("used"); built.splice(k,1); paint(); };
      });
    }
    document.getElementById("undo").onclick = ()=>{
      const last = built.pop(); if(!last) return; last.chip.classList.remove("used"); paint();
    };
    document.getElementById("check").onclick = ()=>{
      const attempt = built.map(x=>x.word).join(" ").replace(/\s+/g," ").trim();
      const target = it.ans.replace(/\s+/g," ").trim();
      const ok = attempt.toLowerCase() === target.toLowerCase();
      if(ok){
        addXP(5);
        const last = i === st.items.length-1;
        feedback(true, `${it.fa}`, last?"پایان":"بعدی", ()=>{
          if(last) finishStep();
          else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
        });
      } else {
        S.wrong.push({key:st.id+"_"+i, ts:Date.now()}); save();
        feedback(false, `پاسخ درست: ${it.ans}\n${it.fa||""}`, i===st.items.length-1?"پایان":"بعدی", ()=>{
          if(i===st.items.length-1) finishStep();
          else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
        });
      }
    };
  }
  draw();
}

/* SORT */
function rSort(st, el){
  let sel = null, placed = 0, errors = 0;
  const items = [...st.items].sort(()=>Math.random()-.5);
  el.innerHTML = `<div class="card">
    <p class="muted">${esc(st.tip||"هر مورد را در دستهٔ درست قرار بده.")}</p>
    <div class="chips" id="pool"></div>
    <div class="bins" id="bins"></div></div>`;
  const pool = document.getElementById("pool");
  items.forEach(it=>{
    const c = document.createElement("button");
    c.className = "chip"; c.textContent = it.t; c.dataset.b = it.b;
    c.onclick = ()=>{ pool.querySelectorAll(".chip").forEach(x=>x.classList.remove("picked"));
      c.classList.add("picked"); sel = c; };
    pool.appendChild(c);
  });
  const bins = document.getElementById("bins");
  st.bins.forEach((name,bi)=>{
    const b = document.createElement("div"); b.className = "bin";
    b.innerHTML = `<h4>${esc(name)}</h4><div class="inner"></div>`;
    b.onclick = ()=>{
      if(!sel) return;
      if(+sel.dataset.b === bi){
        b.querySelector(".inner").appendChild(sel);
        sel.classList.remove("picked"); sel.classList.add("used");
        sel.style.pointerEvents="none"; sel = null; placed++; addXP(2); playCorrect();
        if(placed === items.length){
          setTimeout(()=>feedback(true, "همه را درست دسته‌بندی کردی!", "ادامه", finishStep), 250);
        }
      } else {
        errors++; loseHeart(); playWrong();
        const ref = sel; ref.classList.add("no"); setTimeout(()=>ref.classList.remove("no"),400);
      }
    };
    bins.appendChild(b);
  });
}

/* WORD BUILD */
function rWordBuild(st, el){
  let i = 0;
  function hl(box, phrase, cls){
    const words = phrase.split(" ").map(w=>w.replace(/[^A-Za-z'\-]/g,"").toLowerCase());
    const spans = [...box.querySelectorAll(".w")];
    for(let k=0;k<=spans.length-words.length;k++){
      const seg = spans.slice(k,k+words.length).map(s=>s.textContent.replace(/[^A-Za-z'\-]/g,"").toLowerCase());
      if(seg.join(" ") === words.join(" ")){ spans.slice(k,k+words.length).forEach(s=>s.classList.add(cls)); return; }
    }
  }
  function draw(){
    const it = st.items[i];
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="display:flex;justify-content:space-between;font-size:13px;color:var(--tx2);font-weight:700">
        <span>جمله ${i+1} از ${st.items.length}</span>
        <div class="bar" style="width:60%"><i style="width:${(i/st.items.length)*100}%"></i></div>
      </div>
      ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
      ${it.em?`<div style="text-align:center;font-size:56px;margin:12px 0">${it.em}</div>`:""}
      <div style="text-align:center;margin:12px 0">
        <button class="btn blue sm" id="play" style="padding:12px 24px;font-size:15px">🔊 پخش جمله</button>
      </div>
      <div class="sentblock">
        <div id="sentBox" class="ltr" dir="ltr" style="font-size:17px;line-height:2.4;text-align:left"></div>
        <div class="fa" id="faBox" style="display:none">${esc(it.fa)}</div>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn sec sm" style="flex:1" id="all">👁️ نمایش معنی همه</button>
      </div>
      <div id="checkBox"></div></div>`;
    const box = document.getElementById("sentBox");
    const toks = it.en.split(" ");
    let revealed = 0;
    toks.forEach((t,idx)=>{
      const key = t.replace(/[^A-Za-z'\-]/g,"").toLowerCase();
      const span = document.createElement("span");
      span.className = "w blurw"; span.textContent = t; span.dataset.w = key;
      span.onclick = e=>{
        e.stopPropagation();
        if(!span.classList.contains("on")){
          span.classList.add("on"); revealed++;
          if(revealed >= toks.length) document.getElementById("faBox").style.display="block";
        }
        wordPopup(key);
      };
      box.appendChild(span);
      if(idx < toks.length-1) box.appendChild(document.createTextNode(" "));
    });
    if(it.vp) it.vp.forEach(v=> hl(box, v, "vb"));
    if(it.sp) it.sp.forEach(v=> hl(box, v, "vb2"));
    document.getElementById("play").onclick = ()=> speakItem(it);
    document.getElementById("all").onclick = ()=>{
      box.querySelectorAll(".w").forEach(x=>x.classList.add("on"));
      document.getElementById("faBox").style.display="block";
    };
    if(it.check){
      const c = it.check;
      const optBox = document.createElement("div");
      optBox.style.marginTop = "16px";
      optBox.style.borderTop = "2px dashed var(--line)";
      optBox.style.paddingTop = "16px";
      const order = c.opts.map((_,k)=>k).sort(()=>Math.random()-.5);
      const ansIdx = order.indexOf(c.ans);
      optBox.innerHTML = `<p class="muted" style="margin:0 0 8px">✅ معنی کلمه را انتخاب کن:</p>
        <p class="q ltr" dir="ltr" style="text-align:left;margin:6px 0 10px;font-size:15px">${esc(c.q)}</p>`;
      const choices = document.createElement("div");
      order.forEach((orig, pos)=>{
        const b = document.createElement("button");
        b.className = "opt";
        b.innerHTML = `<span class="key">${"ABC"[pos]}</span><span class="ltr" dir="ltr">${esc(c.opts[orig])}</span>`;
        b.onclick = ()=>{
          const ok = pos === ansIdx;
          [...choices.children].forEach((x,k)=>{ x.classList.add("dis");
            if(k===ansIdx) x.classList.add("ok"); else if(k===pos) x.classList.add("no"); });
          if(ok){ addXP(3); playCorrect(); }
          else { loseHeart(); playWrong(); }
          const last = i === st.items.length-1;
          feedback(ok, c.ex, last?"پایان":"جملهٔ بعدی", ()=>{
            if(last) finishStep();
            else { i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
          });
        };
        choices.appendChild(b);
      });
      optBox.appendChild(choices);
      document.getElementById("checkBox").appendChild(optBox);
    } else {
      nextBtn(i<st.items.length-1 ? "جملهٔ بعدی" : "پایان");
    }
  }
  draw();
}

/* DIALOG REVEAL (line by line) */
function rDialogReveal(st, el){
  let i = 0;
  function draw(){
    const l = st.lines[i];
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="display:flex;justify-content:space-between;font-size:13px;color:var(--tx2);font-weight:700">
        <span>خط ${i+1} از ${st.lines.length}</span>
        <div class="bar" style="width:60%"><i style="width:${(i/st.lines.length)*100}%"></i></div>
      </div>
      ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
      <div style="text-align:center;margin:12px 0">
        <button class="btn blue sm" id="play" style="padding:12px 24px">🔊 پخش</button>
      </div>
      <div class="bub ${i%2===0?'a':'b'}" style="max-width:100%">
        <span class="spk ltr">${esc(l.s)}</span>
        ${tap(l.en, l.fa)}
      </div>
      <div class="row" style="margin-top:14px">
        <button class="btn sec sm" style="flex:1" id="tr">👁️ نمایش ترجمه</button>
        <button class="btn sm" style="flex:1" id="nx">${i<st.lines.length-1?"خط بعدی":"پایان"}</button>
      </div>
      <div id="trBox" class="muted" style="display:none;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">${esc(l.fa)}</div>
    </div>`;
    document.getElementById("play").onclick = ()=> speakItem(l);
    document.getElementById("tr").onclick = ()=>{
      const tb = document.getElementById("trBox");
      tb.style.display = tb.style.display === "none" ? "block" : "none";
    };
    document.getElementById("nx").onclick = ()=>{
      if(i < st.lines.length-1){ i++; draw(); window.scrollTo({top:0, behavior:"smooth"}); }
      else finishStep();
    };
  }
  draw();
}

/* LISTEN MCQ */
function rListenMcq(st, el){
  let answered = false, wrongTries = 0;
  el.innerHTML = `<div class="card">
    ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
    <div style="text-align:center;margin:12px 0">
      <button class="btn blue sm" id="play" style="padding:14px 30px;font-size:16px">🔊 پخش متن</button>
      <p class="muted" id="playState" style="margin-top:8px"></p>
    </div>
    <p class="q ltr" dir="ltr" style="text-align:left;margin-top:16px">${esc(st.q)}</p>
    ${st.qFa?`<p class="muted" style="margin-top:-4px">${esc(st.qFa)}</p>`:""}
    <div id="opts" style="margin-top:12px"></div>
  </div>`;
  const playBtn = document.getElementById("play");
  let playing = false;
  playBtn.onclick = ()=>{
    if(playing) return;
    playing = true; playBtn.disabled = true; playBtn.textContent = "🔊 در حال پخش...";
    let k = 0;
    (function next(){
      if(!playBtn.isConnected){ playing = false; return; }
      if(k >= st.lines.length){ playing = false; playBtn.disabled = false; playBtn.textContent = "🔊 پخش دوباره"; return; }
      speak(st.lines[k].t); k++;
      setTimeout(next, 2800);
    })();
    document.getElementById("playState").textContent = "می‌توانی بعداً دوباره گوش کنی.";
  };
  const box = document.getElementById("opts");
  st.opts.forEach((o, idx)=>{
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = `<span class="key">${"ABCD"[idx]}</span><span class="ltr" dir="ltr">${esc(o)}</span>`;
    b.onclick = ()=> answer(idx);
    box.appendChild(b);
  });
  function answer(idx){
    if(answered) return;
    const ok = idx === st.ans;
    if(ok){
      answered = true;
      [...box.children].forEach((c,k)=>{ c.classList.add("dis");
        if(k===st.ans) c.classList.add("ok"); else if(k===idx) c.classList.add("no"); });
      if(wrongTries < 2) addXP(5);
      feedback(true, st.ex, "ادامه", finishStep);
    } else {
      wrongTries++;
      box.children[idx].classList.add("no");
      if(wrongTries >= 2){
        answered = true;
        [...box.children].forEach((c,k)=>{ c.classList.add("dis");
          if(k===st.ans) c.classList.add("ok"); });
        S.wrong.push({key:st.id, ts:Date.now()}); save();
        feedback(false, "دو بار اشتباه. " + (st.ex||""), "ادامه", finishStep);
      } else {
        playWrong(); loseHeart();
        box.children[idx].classList.add("dis");
        toast("❌ دوباره تلاش کن");
      }
    }
  }
}

/* SPEAK */
function rSpeak(st, el){
  let i = 0, rec = null, chunks = [];
  const hasRec = !!(navigator.mediaDevices && window.MediaRecorder);
  function draw(){
    const it = st.items[i];
    const hl = it.hl ? new RegExp(it.hl, "g") : null;
    const marked = hl ? it.en.replace(hl, `<b style="color:var(--red)">${it.hl}</b>`) : it.en;
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="font-size:13px;color:var(--tx2);font-weight:700">جمله ${i+1} از ${st.items.length}</div>
      ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
      <p class="ltr" dir="ltr" style="font-size:20px;font-weight:800;text-align:center;margin:20px 0;line-height:1.6">${marked}</p>
      <div class="row">
        <button class="btn blue sm" style="flex:1" id="listen">🔊 گوش بده</button>
        ${hasRec?`<button class="btn sm" style="flex:1" id="rec">🎙️ ضبط</button>`:""}
      </div>
      <div id="recState" class="muted" style="text-align:center;margin-top:10px;font-size:13px">${hasRec?"":"ضبط صدا در این مرورگر پشتیبانی نمی‌شود."}</div>
    </div>`;
    document.getElementById("listen").onclick = ()=> speakItem(it);
    const rb = document.getElementById("rec");
    if(rb) rb.onclick = async ()=>{
      if(rec && rec.state === "recording"){ rec.stop(); return; }
      try{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        chunks = []; rec = new MediaRecorder(stream);
        rec.ondataavailable = e=>chunks.push(e.data);
        rec.onstop = ()=>{
          stream.getTracks().forEach(t=>t.stop());
          const url = URL.createObjectURL(new Blob(chunks, {type:"audio/webm"}));
          document.getElementById("recState").innerHTML =
            `✅ ضبط شد — <audio controls src="${url}" style="width:100%;margin-top:10px"></audio>`;
          rb.textContent = "🎙️ ضبط"; addXP(3);
        };
        rec.start(); rb.textContent = "⏹️ توقف";
        document.getElementById("recState").textContent = "در حال ضبط...";
      }catch(e){ document.getElementById("recState").textContent = "دسترسی به میکروفون ممکن نشد."; }
    };
    nextBtn(i<st.items.length-1?"بعدی":"پایان");
  }
  draw();
}

/* TEACH */
function rTeach(st, el){
  let html = `<div class="card">`;
  st.blocks.forEach(b=>{
    if(b.h) html += `<h3>${b.h}</h3>`;
    if(b.p) html += `<p>${b.p}</p>`;
    if(b.cmp) html += `<div class="teachbox">
        <div style="font-weight:800">${esc(b.cmp.fa)}</div>
        <div class="ltr" dir="ltr" style="font-size:18px;font-weight:800;color:var(--blue);margin-top:6px;text-align:left">${esc(b.cmp.en)}</div>
      </div>`;
    if(b.table){
      html += `<table class="g"><tr>${b.table.head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr>`;
      b.table.rows.forEach(r=>{
        html += `<tr>${r.map((c,i)=>`<td class="${i>1?'l':''}">${c}</td>`).join("")}</tr>`;
      });
      html += `</table>`;
    }
    if(b.exs) b.exs.forEach(ex=>{
      html += `<div class="ex">
        <div class="en">${tap(ex.en, ex.fa)}</div>
        <div class="fa" style="display:flex;align-items:center;gap:10px">
          <span>${esc(ex.fa)}</span>
          <button class="btn blue sm" style="padding:4px 10px;font-size:12px" onclick="window.__spk&&window.__spk(${JSON.stringify(ex).replace(/"/g,'&quot;')})">🔊</button>
        </div>
      </div>`;
    });
  });
  html += `</div>`;
  el.innerHTML = html;
  // wire audio buttons
  el.querySelectorAll(".ex").forEach((box, idx)=>{
    const ex = st.blocks.flatMap(b=>b.exs||[])[idx];
    if(ex && ex.audioId){
      box.querySelector(".ex .en").style.cursor = "pointer";
      box.querySelector(".ex .en").onclick = ()=> speakItem(ex);
    }
  });
  nextBtn("فهمیدم");
}

/* READING */
function rReading(st, el){
  let html = `<div class="card">`;
  if(st.tip) html += `<p class="hint">${esc(st.tip)}</p>`;
  st.paras.forEach(para=>{
    html += `<div style="margin-bottom:18px">`;
    para.en.forEach((s, idx)=>{
      html += `<div class="sentblock">${tap(s, para.fa[idx]||"")}
        <button class="btn blue sm" style="margin-top:8px;padding:4px 10px;font-size:12px" data-s="${esc(s)}">🔊 پخش</button>
      </div>`;
    });
    html += `</div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
  el.querySelectorAll("[data-s]").forEach(b=>{
    b.onclick = e=>{ e.stopPropagation(); speak(b.dataset.s); };
  });
  nextBtn("پایان");
}

/* SKIM & SCAN */
function rSkimScan(st, el){
  let phase = "skim";
  let timeLeft = st.timer || 30;
  let timerId = null;

  function drawSkim(){
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="font-size:13px;color:var(--tx2);font-weight:700">۱) خواندن سریع</div>
      <p class="hint">متن را سریع بخوان. بعد از پایان زمان، متن پنهان می‌شود و یک سؤال می‌بینی.</p>
      <div class="timer" id="timer">${timeLeft}</div>
      <div class="para" id="para">${st.paras.map(p=>`<p style="margin:10px 0">${esc(p)}</p>`).join("")}</div>
      <button class="btn sec sm" style="width:100%;margin-top:12px" id="done">✅ تمام شد — ادامه</button>
    </div>`;
    const tEl = document.getElementById("timer");
    timerId = setInterval(()=>{
      timeLeft--;
      tEl.textContent = timeLeft;
      if(timeLeft <= 10) tEl.classList.add("warn");
      if(timeLeft <= 0){ clearInterval(timerId); timerId = null; drawScan(); }
    }, 1000);
    stepCleanup = ()=>{ if(timerId){ clearInterval(timerId); timerId = null; } };
    document.getElementById("done").onclick = ()=>{
      if(timerId){ clearInterval(timerId); timerId = null; }
      drawScan();
    };
  }

  function drawScan(){
    const order = st.scanOpts.map((_,k)=>k).sort(()=>Math.random()-.5);
    const ansIdx = order.indexOf(st.scanAns);
    el.innerHTML = `<div class="card">
      <div class="xpbar" style="font-size:13px;color:var(--tx2);font-weight:700">۲) اسکن</div>
      <p class="q ltr" dir="ltr" style="text-align:left">${esc(st.scanQ)}</p>
      ${st.scanQFa?`<p class="muted" style="margin-top:-4px">${esc(st.scanQFa)}</p>`:""}
      <div id="opts" style="margin-top:12px"></div>
      <button class="btn sec sm" style="width:100%;margin-top:12px" id="showPara">👁️ نمایش متن</button>
      <div class="para" id="para" style="display:none;margin-top:12px">${st.paras.map(p=>`<p style="margin:10px 0">${esc(p)}</p>`).join("")}</div>
    </div>`;
    const box = document.getElementById("opts");
    let answered = false, wrongTries = 0;
    order.forEach((orig, pos)=>{
      const b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = `<span class="key">${"ABC"[pos]}</span><span class="ltr" dir="ltr">${esc(st.scanOpts[orig])}</span>`;
      b.onclick = ()=>{
        if(answered) return;
        const ok = pos === ansIdx;
        if(ok){
          answered = true;
          [...box.children].forEach((c,k)=>{ c.classList.add("dis");
            if(k===ansIdx) c.classList.add("ok"); else if(k===pos) c.classList.add("no"); });
          addXP(5);
          feedback(true, st.scanEx, "ادامه", ()=>{
            // move to next step in the section (wordbuild)
            if(state.stepIdx < state.steps.length-1){
              state.stepIdx++; go("step");
            } else finishStep();
          });
        } else {
          wrongTries++;
          box.children[pos].classList.add("no");
          if(wrongTries >= 2){
            answered = true;
            [...box.children].forEach((c,k)=>{ c.classList.add("dis");
              if(k===ansIdx) c.classList.add("ok"); });
            feedback(false, "دو بار اشتباه. " + st.scanEx, "ادامه", ()=>{
              if(state.stepIdx < state.steps.length-1){ state.stepIdx++; go("step"); }
              else finishStep();
            });
          } else {
            playWrong(); loseHeart();
            box.children[pos].classList.add("dis");
            toast("❌ دوباره تلاش کن");
          }
        }
      };
      box.appendChild(b);
    });
    document.getElementById("showPara").onclick = ()=>{
      const p = document.getElementById("para");
      p.style.display = p.style.display === "none" ? "block" : "none";
    };
  }

  drawSkim();
}

/* ROLEPLAY */
function rRoleplay(st, el){
  let score = 0;
  el.innerHTML = `<div class="card">
      ${st.tip?`<p class="hint">${esc(st.tip)}</p>`:""}
      <div id="rp"></div></div>`;
  const box = document.getElementById("rp");
  function drawLine(k){
    if(!box.isConnected) return;
    if(k >= st.lines.length){
      feedback(true, `🎉 نقش‌آفرینی کامل شد! امتیاز: ${score}`, "پایان", finishStep);
      return;
    }
    const l = st.lines[k];
    const d = document.createElement("div");
    d.className = "bub " + (k%2===0 ? "a" : "b");
    d.style.maxWidth = "100%";
    if(!l.opts){
      d.innerHTML = `<span class="spk ltr">${esc(l.s)}</span>${tap(l.en, l.fa||"")}`;
      box.appendChild(d); speakItem(l);
      setTimeout(()=>drawLine(k+1), 1600);
      return;
    }
    d.innerHTML = `<span class="spk ltr">${esc(l.s)} (نوبت تو)</span>`;
    box.appendChild(d);
    const choices = document.createElement("div");
    const order = l.opts.map((_,i)=>i).sort(()=>Math.random()-.5);
    order.forEach((origIdx, pos)=>{
      const b = document.createElement("button");
      b.className = "opt";
      b.style.fontSize = "14px";
      b.innerHTML = `<span class="key">${"ABC"[pos]}</span><span class="ltr" dir="ltr">${esc(l.opts[origIdx])}</span>`;
      b.onclick = ()=>{
        const ok = origIdx === l.ans;
        [...choices.children].forEach((c,j)=>{ c.classList.add("dis");
          if(order[j] === l.ans) c.classList.add("ok"); else if(j===pos) c.classList.add("no"); });
        if(ok){ score += 5; addXP(5); playCorrect(); speakItem(l); }
        else { playWrong(); loseHeart(); S.wrong.push({key:st.id+"_"+k, ts:Date.now()}); save(); }
        setTimeout(()=>{ choices.remove(); drawLine(k+1); }, 1000);
      };
      choices.appendChild(b);
    });
    box.appendChild(choices);
  }
  drawLine(0);
}

/* CARDS / SRS */
function renderCards(){
  if(!S.cards.length){
    $app.innerHTML = `<div class="empty"><span class="e">🃏</span>
      هنوز کارتی نساخته‌ای.<br>روی کلمه‌ها بزن و به کارت‌ها اضافه کن.</div>`;
    return;
  }
  const due = S.cards.filter(c=>c.due <= Date.now());
  const list = (due.length ? due : S.cards).slice(0, 20);
  let i = 0;
  function draw(){
    const c = list[i];
    $app.innerHTML = `<h1 class="page">🃏 مرور کارت‌ها</h1>
      <p class="muted">${i+1} از ${list.length} — کل کارت‌ها: ${S.cards.length}</p>
      <div class="card">
        <div class="fc" id="fc"><div class="inner">
          <div class="face"><div class="en">${esc(c.w)}</div>
            <div class="muted" style="font-size:13px">برای دیدن معنی بزن</div></div>
          <div class="face back"><div class="fa" style="font-size:26px">${esc(c.fa||"—")}</div></div>
        </div></div>
        <div class="row" style="margin-top:14px">
          <button class="btn red sm" style="flex:1" id="again">🔁 دوباره</button>
          <button class="btn sm" style="flex:1" id="good">✅ بلدم</button>
        </div>
        <button class="btn blue sm" style="width:100%;margin-top:10px" id="spk">🔊 تلفظ</button>
      </div>`;
    const fc = document.getElementById("fc");
    fc.onclick = ()=> fc.classList.toggle("flip");
    document.getElementById("spk").onclick = ()=> speak(c.w);
    document.getElementById("again").onclick = ()=>{
      c.box = Math.max(0, c.box-1); c.lapses++;
      c.due = Date.now() + 60*1000; save();
      if(i < list.length-1){ i++; draw(); } else { toast("مرور تمام شد"); go("map"); }
    };
    document.getElementById("good").onclick = ()=>{
      c.box = Math.min(5, c.box+1);
      c.due = Date.now() + [0,10,60,360,1440,4320][c.box] * 60 * 1000;
      addXP(2); save();
      if(i < list.length-1){ i++; draw(); } else { toast("مرور تمام شد ✅"); go("map"); }
    };
  }
  draw();
}

/* REVIEW */
function renderReview(){
  const n = S.wrong.length;
  const s5 = state.lesson.sections.find(s=>s.id==="s5");
  $app.innerHTML = `<h1 class="page">🔁 مرور</h1>
    ${n===0 ? `<div class="empty"><span class="e">🎉</span>هیچ خطایی ثبت نشده!</div>`
    : `<div class="card"><p>${n} مورد برای مرور داری.</p>
        <button class="btn" id="clearW">پاک کردن همه</button></div>`}
    <div class="card">
      <h3>تمرین‌های اضافی</h3>
      <p class="muted">برای تقویت بیشتر، این مجموعه‌ها را تمرین کن.</p>
      <button class="btn sec sm" style="width:100%;margin-bottom:8px" data-extra="s5k">آزمون کامل ۱</button>
      <button class="btn sec sm" style="width:100%" data-extra="s5l">آزمون کامل ۲</button>
    </div>`;
  const cw = document.getElementById("clearW");
  if(cw) cw.onclick = ()=>{ S.wrong = []; save(); renderReview(); };
  $app.querySelectorAll("[data-extra]").forEach(b=>{
    b.onclick = ()=>{
      const st = s5.steps.find(x=>x.id === b.dataset.extra);
      if(!st) return;
      state.section = s5; state.steps = [st]; state.stepIdx = 0;
      go("step");
    };
  });
}

/* STATS */
function renderStats(){
  let total = 0, done = 0;
  state.lesson.sections.forEach(s=>{
    total += s.steps.length;
    done += s.steps.filter(x=>S.done[x.id]).length;
  });
  const pct = total ? Math.round(done/total*100) : 0;
  $app.innerHTML = `<h1 class="page">📊 پیشرفت من</h1>
    <div class="card">
      <div style="display:flex;justify-content:space-around;text-align:center;margin:10px 0">
        <div><div style="font-size:34px">⭐</div><b>${S.xp}</b><div class="muted">امتیاز</div></div>
        <div><div style="font-size:34px">🔥</div><b>${S.streak}</b><div class="muted">روز پیوسته</div></div>
        <div><div style="font-size:34px">🃏</div><b>${S.cards.length}</b><div class="muted">کارت</div></div>
      </div></div>
    <div class="card">
      <h3>پیشرفت درس ۱</h3>
      <div class="bar" style="height:16px"><i style="width:${pct}%"></i></div>
      <p class="muted">${done} از ${total} بخش (${pct}%)</p></div>
    <div class="card">
      <h3>تنظیمات</h3>
      <p class="muted">آدرس فایل‌های صوتی (اختیاری) — نام هر فایل باید <span class="ltr">audioId.mp3</span> باشد:</p>
      <input id="audioBase" placeholder="https://example.com/audio/" value="${esc(S.audioBase||"")}"
        style="width:100%;padding:12px;border-radius:12px;border:2px solid var(--line);
        background:var(--bg2);color:var(--tx);direction:ltr;font-size:14px">
      <button class="btn sm" style="width:100%;margin-top:10px" id="saveAudio">ذخیره</button></div>
    <div class="card">
      <button class="btn red sm" style="width:100%" id="reset">🗑️ پاک کردن همهٔ پیشرفت</button>
    </div>`;
  document.getElementById("saveAudio").onclick = ()=>{
    S.audioBase = document.getElementById("audioBase").value.trim(); save(); toast("ذخیره شد ✅");
  };
  document.getElementById("reset").onclick = ()=>{
    if(confirm("همهٔ پیشرفت پاک شود؟")){
      localStorage.removeItem(STORE_KEY); S = JSON.parse(JSON.stringify(DEFAULT));
      save(); applyTheme(); paintHUD(); go("map");
    }
  };
}

/* ============ BOOT ============ */
window.__spk = (item)=>{ try{ speakItem(item); }catch(e){} };
regenHearts(); applyTheme(); paintHUD(); touchStreak();
if(LESSONS.length) state.lesson = LESSONS[0];
go("map");
setInterval(()=>{ regenHearts(); paintHUD(); }, 60000);

if("serviceWorker" in navigator && location.protocol !== "file:"){
  window.addEventListener("load", ()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); });
}
(function(){
  const manifest = {
    name:"English 2", short_name:"English 2", start_url:".", display:"standalone",
    background_color:"#ffffff", theme_color:"#58cc02", dir:"rtl", lang:"fa",
    icons:[{src:"data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#58cc02"/><text x="96" y="128" font-size="100" text-anchor="middle" fill="#fff">📘</text></svg>'
    ), sizes:"192x192", type:"image/svg+xml", purpose:"any"}]
  };
  const blob = new Blob([JSON.stringify(manifest)], {type:"application/json"});
  const link = document.createElement("link");
  link.rel = "manifest"; link.href = URL.createObjectURL(blob);
  document.head.appendChild(link);
})();

})();