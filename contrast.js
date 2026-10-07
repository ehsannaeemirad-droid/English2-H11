/* Contrast gate (plan Step 9): every text/background pair >= 4.5:1,
   control borders >= 3:1. Reads the token values from styles.css. */
const fs = require("fs");
const css = fs.readFileSync("styles.css", "utf8");
let fails = 0;
const fail = m => { fails++; console.log("FAIL: " + m); };
const ok = m => console.log("ok  " + m);

function tokens(block){
  const t = {};
  block.replace(/--([a-z0-9-]+):([^;]+);/g, (_, k, v)=>{ t[k] = v.trim(); return _; });
  return t;
}
function block(sel){
  const m = css.match(new RegExp(sel.replace(/[[\]"]/g, "\\$&") + "\\{([^}]*)\\}"));
  return m ? m[1] : null;
}
function resolve(t, v, depth){
  depth = depth || 0;
  if(!v) return null;
  v = v.trim();
  if(v[0] === "#") return v;
  if(/^rgba?\(/.test(v)) return v;
  const m = v.match(/var\(--([a-z0-9-]+)\)/);
  if(m && depth < 5) return resolve(t, t[m[1]], depth+1);
  return null;
}
function lum(c){
  if(c[0] === "#"){
    let h = c.slice(1);
    if(h.length === 3) h = h.split("").map(x=>x+x).join("");
    const [r,g,b] = [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)
      .map(v=> v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if(!m) return null;
  const p = m[1].split(",").map(Number);
  const [r,g,b] = [p[0],p[1],p[2]].map(v=>{ v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function ratio(a, b){
  const l1 = lum(a), l2 = lum(b);
  if(l1 == null || l2 == null) return null;
  const hi = Math.max(l1,l2), lo = Math.min(l1,l2);
  return (hi + 0.05) / (lo + 0.05);
}
function check(theme, t, pairs){
  const missing = [];
  const get = k => { const v = resolve(t, t[k]); if(!v){ missing.push(k); return "#000"; } return v; };
  pairs.forEach(([fgk, bgk, min, label])=>{
    const r = ratio(get(fgk), get(bgk));
    if(r == null){ fail(theme + ": cannot compute " + label); return; }
    if(r < min - 0.05) fail(theme + ": " + label + " = " + r.toFixed(2) + ":1 (needs " + min + ":1)");
    else ok(theme + ": " + label + " = " + r.toFixed(2) + ":1");
  });
  if(missing.length) fail(theme + ": missing tokens " + missing.join(","));
}

const light = tokens(block(":root"));
const dark  = tokens(block('html[data-theme="dark"]'));

/* pairs from the plan's token table */
const pairs = [
  ["tx","paper",4.5,"text on paper"],
  ["tx2","paper",4.5,"secondary text on paper"],
  ["tx","card",4.5,"text on card"],
  ["tx2","card",4.5,"secondary on card"],
  ["ink-tx","ink",4.5,"text on primary"],
  ["ok-tx","ok-tint",4.5,"correct text on tint"],
  ["no-tx","no-tint",4.5,"wrong text on tint"],
  ["hl-tx","hl",4.5,"highlighter text"],
  ["ctl","paper",3,"control border on paper"],
  ["ctl","card",3,"control border on card"]
];
check("light", light, pairs);
check("dark", dark, pairs);

console.log(fails ? "\nCONTRAST GATE FAILED" : "\nCONTRAST GATE PASSED");
process.exit(fails ? 1 : 0);
