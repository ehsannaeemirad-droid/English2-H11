/* ============================================================
   Guided / Standard / Challenge rendering helpers
   (plan Step 4) plus audio playback and a speaking recorder
   placeholder (plan Step 11).

   These are injected into the engine via a small runtime
   shim in index.html so renderItem / the runners can call
   them without a module loader.
   ============================================================ */
"use strict";

/* ---------- mode config (Step 4 matrix) ---------- */
const MODES = {
  guided:   { fa:"راهنمایی‌شده",  round:4,  attempts:2, opts:2, showQ:true,  showHint:true,  audioSpeed:0.8, transcript:true,  timer:null },
  standard: { fa:"استاندارد",     round:6,  attempts:2, opts:3, showQ:false, showHint:false, audioSpeed:1.0, transcript:false, timer:null },
  challenge:{ fa:"چالشی",         round:8,  attempts:1, opts:4, showQ:false, showHint:false, audioSpeed:1.0, transcript:false, timer:60 }
};
const modeCfg = ()=> MODES[S.mode] || MODES.standard;

/* ---------- audio ---------- */
function speak(text, rate){
  if(!S.sound) return;
  if(!("speechSynthesis" in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text==null?"":text).replace(/<[^>]*>/g,""));
    u.lang = "en-US";
    u.rate = rate != null ? rate : (S.mode === "guided" ? 0.8 : 0.9);
    u.pitch = 1;
    const v = window.speechSynthesis.getVoices().find(x=>/en-(US|GB)/i.test(x.lang));
    if(v) u.voice = v;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
function playAudio(audioId){
  if(!S.sound) return;
  if(!audioId){ return; }
  const path = AUDIO_MANIFEST && AUDIO_MANIFEST[audioId];
  if(path){
    const a = new Audio(path);
    a.playbackRate = modeCfg().audioSpeed;
    a.play().catch(()=>{});
    return;
  }
  speak(textForAudio(audioId));
}
function textForAudio(audioId){
  return null;
}

/* ---------- tap — sentence markup with optional inline audio ---------- */
function tap(text, fa, audioId){
  if(!text) return "";
  const parts = String(text).split(/(<b>.*?<\/b>|<i>.*?<\/i>|<u>.*?<\/u>)/gi);
  let out = "";
  for(const p of parts){
    if(!p) continue;
    if(/^<(b|i|u)>/i.test(p)){
      out += p;
    } else {
      out += '<span class="word" tabindex="0" aria-label=" '+escAttr(p)+' ">'+esc(p)+"</span>";
    }
  }
  const faHtml = fa ? (' <span class="word-fa">'+esc(fa)+"</span>") : "";
  const audioHtml = audioId ? (' <span class="sent-audio" data-audio="'+escAttr(audioId)+'" role="button" tabindex="0" aria-label="صدای '+escAttr(audioId)+'" title="تلفظ">🔊</span>') : "";
  return '<span class="sent">'+out+faHtml+audioHtml+"</span>";
}
function escAttr(s){ return String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------- audio button ---------- */
function audioBtn(text, id){
  const key = id || ("tts-"+encodeURIComponent(String(text==null?"":text)));
  return '<button class="audio-btn" data-audio="'+escAttr(key)+'" title="تلفظ" aria-label="تلفظ">🔊</button>';
}

/* ---------- choice item (Step 3). onAnswer(idx) ---------- */
function renderChoiceItem(it, el, onAnswer){
  const cfg = modeCfg();
  const opts = it.opts || [];
  const cnt = Math.min(cfg.opts, opts.length);
  const chosen = it._chosen;
  let html = "";
  if(cfg.showQ){
    html += '<p class="qline">'+esc(it.qFa || it.q || "")+"</p>";
  } else {
    html += '<button class="qtip btn sm" type="button">ترجمه</button><p class="qline" hidden>'+esc(it.qFa || it.q || "")+"</p>";
  }
  let optsHtml = "";
  for(let i=0;i<cnt;i++){
    const o = opts[i];
    const sel = chosen === i;
    const dis = (chosen != null && chosen !== i);
    optsHtml += '<button class="opt'+(sel?" sel":"")+(dis?" dis":"")+'" type="button" data-idx="'+i+'" aria-pressed="'+(sel?"true":"false")+'">' +
      '<span class="opt-en">'+esc(o)+
      (it.audioId?' <button class="audio-in-opt" type="button" data-audio="'+escAttr(it.audioId)+'" title="تلفظ" aria-label="تلفظ">🔊</button>':'')+"</span>"+
      (it.ans == i ? ' <span class="opt-mark" aria-hidden="true">✓</span>' : "") +
      "</button>";
  }
  html += '<div class="opts" role="radiogroup" aria-label="گزینه‌ها">'+optsHtml+"</div>";
  html += (cfg.showHint ? '<p class="hint">'+esc(it.hintFa || "")+"</p>" : "");
  el.innerHTML = html;

  const qtip = el.querySelector(".qtip");
  if(qtip){
    qtip.onclick = ()=>{
      const qline = el.querySelector(".qline");
      const show = qline && qline.hasAttribute("hidden");
      if(qline) qline.toggleAttribute("hidden", !show);
      qtip.textContent = show ? "پنهان کردن" : "ترجمه";
    };
  }

  const optsEls = el.querySelectorAll(".opt");
  /* disable in Challenge after first answer */
  optsEls.forEach((b, i)=>{
    b.onclick = ()=>{
      if(it._locked) return;
      if(i >= cnt) return;
      it._chosen = i;
      optsEls.forEach(o=> o.classList.toggle("sel", o === b));
      if(S.mode === "challenge") it._locked = true;
      onAnswer(i);
    };
  });
  /* audio inside an option */
  el.querySelectorAll(".audio-in-opt").forEach(a=>{
    a.onclick = e=>{ e.stopPropagation(); playAudio(a.dataset.audio); };
  });
}

/* ---------- typed item (Step 3). onAnswer(rawText) ---------- */
function renderTypedItem(it, el, onAnswer){
  const cfg = modeCfg();
  let html = "";
  if(cfg.showQ){
    html += '<p class="qline">'+esc(it.qFa || it.q || "")+"</p>";
  } else {
    html += '<button class="qtip btn sm" type="button">ترجمه</button><p class="qline" hidden>'+esc(it.qFa || it.q || "")+"</p>";
  }
  html += '<div class="typed"><input id="ti" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ' +
    'placeholder="'+(it.placeholder||"پاسخ خود را بنویسید")+'" aria-label="پاسخ"></div>' +
    '<div class="row" style="margin-top:8px"><button class="btn sec" id="chk" type="button" disabled>بررسی</button></div>';
  html += (cfg.showHint ? '<p class="hint">'+esc(it.hintFa || "")+"</p>" : "");
  el.innerHTML = html;

  const qtip = el.querySelector(".qtip");
  if(qtip){
    qtip.onclick = ()=>{
      const qline = el.querySelector(".qline");
      const show = qline && qline.hasAttribute("hidden");
      if(qline) qline.toggleAttribute("hidden", !show);
      qtip.textContent = show ? "پنهان کردن" : "ترجمه";
    };
  }

  const inp = document.getElementById("ti");
  const chk = document.getElementById("chk");
  let resolved = false;
  const accept = (it.typed && it.typed.accept) ? it.typed.accept.map(s=>s.toLowerCase().trim()) : [];
  const near = (it.typed && it.typed.near) || null;

  function attempt(){
    if(resolved) return;
    resolved = true;
    const raw = (inp.value || "").trim();
    inp.disabled = true;
    chk.disabled = true;
    const norm = raw.toLowerCase().normalize("NFKC").replace(/[\u200c\u200b\u200d\ufeff\s]+/g," ");
    onAnswer({ raw, norm, accept, near, rawApa: raw });
  }

  chk.onclick = attempt;
  inp.addEventListener("keydown", e=>{
    if(e.key === "Enter" && !resolved){ e.preventDefault(); attempt(); }
  });
  inp.addEventListener("input", ()=>{ chk.disabled = (inp.value || "").trim().length < 2; });
  setTimeout(()=>{ try{ inp.focus(); inp.select && inp.select(); }catch(e){} }, 0);
}

/* ---------- tap-words item. onAnswer(arrayOfChosenWords) ---------- */
function renderTapWords(it, el, onAnswer){
  const cfg = modeCfg();
  const q = it.qFa || it.q || "";
  let html = cfg.showQ ? '<p class="qline">'+esc(q)+"</p>" :
    '<button class="qtip btn sm" type="button">ترجمه</button><p class="qline" hidden>'+esc(q)+"</p>";
  const targets = (it.targets || []).map(t=> String(t).replace(/<[^>]+>/g,"").trim().toLowerCase());
  const constMap = new Map();
  targets.forEach(t=> constMap.set(t, (constMap.get(t)||0)+1));

  /* tokenize text into word-units, preserving markup spans as single nodes */
  const frag = document.createDocumentFragment();
  const textOnly = String(it.text).replace(/<[^>]+>/g,"");
  const tokens = textOnly.split(/(\s+)/).filter(Boolean);
  let idx = 0;
  for(const tk of tokens){
    const clean = tk.replace(/[.,;:!?،؛؟…]+$/,"").trim().toLowerCase();
    const isT = targets.includes(clean) && constMap.get(clean) > 0;
    if(isT){
      const span = document.createElement("span");
      span.className = "word t target";
      span.textContent = tk;
      span.tabIndex = 0;
      span.dataset.idx = idx;
      span.dataset.token = clean;
      const already = it._chosen && it._chosen.includes(clean);
      if(already) span.classList.add("hl");
      frag.appendChild(span);
      constMap.set(clean, constMap.get(clean)-1);
    } else {
      frag.appendChild(document.createTextNode(tk));
    }
    idx++;
  }
  html += '<div class="taptext"></div>';
  el.innerHTML = html;
  const wrap = el.querySelector(".taptext");
  wrap.appendChild(frag);

  /* re-attach qtip */
  const qtip = el.querySelector(".qtip");
  if(qtip){
    qtip.onclick = ()=>{
      const qline = el.querySelector(".qline");
      const show = qline && qline.hasAttribute("hidden");
      if(qline) qline.toggleAttribute("hidden", !show);
      qtip.textContent = show ? "پنهان کردن" : "ترجمه";
    };
  }

  const chosen = it._chosen ? new Set(it._chosen) : new Set();
  wrap.querySelectorAll(".word.target").forEach(w=>{
    w.onclick = ()=>{
      if(it._locked) return;
      const tok = w.dataset.token;
      if(chosen.has(tok)){ chosen.delete(tok); w.classList.remove("hl"); }
      else { chosen.add(tok); w.classList.add("hl"); }
      onAnswer(Array.from(chosen));
    };
    w.onkeydown = e=>{
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); w.click(); }
    };
  });
  if(cfg.showHint) el.innerHTML += '<p class="hint">'+esc(it.hintFa || "")+"</p>";
  it._chosenArr = Array.from(chosen);
}

/* ---------- speaking recorder placeholder (Step 11) ---------- */
function startRecording(onChunk, onStop, onError){
  if(!navigator.mediaDevices || !window.MediaRecorder){
    onError(new Error("no mic"));
    return null;
  }
  let stream = null, rec = null;
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/mp4")            ? "audio/mp4"
            : MediaRecorder.isTypeSupported("audio/webm")          ? "audio/webm"
            : null;
  function cleanup(){
    if(stream) stream.getTracks().forEach(t=>t.stop());
  }
  navigator.mediaDevices.getUserMedia({audio:true}).then(s=>{
    stream = s;
    rec = new MediaRecorder(stream, {mimeType:mime});
    rec.ondataavailable = e=>{ if(e.data && e.data.size>0) onChunk(e.data); };
    rec.onstop = ()=>{ cleanup(); onStop && onStop(rec.state, rec.mimeType); };
    rec.onerror = e=>{ cleanup(); onError && onError(e.error || new Error("recorder error")); };
    rec.start();
  }).catch(err=>{ cleanup(); onError && onError(err); });
  return {
    stop:()=>{ if(rec && rec.state !== "inactive"){ try{ rec.stop(); }catch(e){} } },
    cancel:()=>{ cleanup(); if(rec && rec.state !== "inactive"){ try{ rec.stop(); }catch(e){} } }
  };
}

/* ---------- keyboard helper: number keys pick choice ---------- */
function wireChoiceNumbers(el, optsEls, onPick){
  el.addEventListener("keydown", e=>{
    if(e.key >= "1" && e.key <= "9"){
      const i = +e.key - 1;
      if(optsEls[i]){ e.preventDefault(); optsEls[i].click(); }
    }
  });
}

/* ---------- tiny escape ---------- */
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* boot-time wiring for the engine's shared audio button */
function wireGlobalAudio(){
  function beep(target){
    target.addEventListener("click", e=>{
      const id = target.dataset.audio;
      if(id) playAudio(id);
    });
    target.addEventListener("keydown", e=>{
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); target.click(); }
    });
  }
  document.addEventListener("click", e=>{
    const t = e.target.closest && e.target.closest(".audio-btn, .audio-in-opt, .sent-audio");
    if(t) beep(t);
  }, true);
  document.addEventListener("keydown", e=>{
    if(e.key === "Enter" || e.key === " "){
      const t = document.activeElement && (document.activeElement.matches(".audio-btn, .audio-in-opt, .sent-audio") || false);
      if(t){ e.preventDefault(); document.activeElement.click(); }
    }
  });
}
if(typeof document !== "undefined") window.addEventListener("DOMContentLoaded", wireGlobalAudio);

/* ---- public shim: expose helpers on window.appAudio so the engine
   and dev verification can call them. These are also the canonical
   names for the mode-aware renderers (Step 4) and audio (Step 11). ---- */
window.appAudio = {
  MODES, modeCfg, speak, playAudio, textForAudio, audioPath,
  tap, esc, escAttr, audioBtn,
  renderChoiceItem, renderTypedItem, renderTapWords,
  startRecording, isMicrophoneAvailable, wireChoiceNumbers
};

/* also expose the global audio button on any dom that already loaded,
   in case app.js boots after DOMContentLoaded */
if(typeof document !== "undefined" && document.readyState !== "loading"){
  try{ wireGlobalAudio(); }catch(e){}
}
