/* Bump this on every release: the shell is cache-first, so an unchanged
   version string would keep serving the previous styles.css / index.html. */
const CACHE = "eng2-v10";
const SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest",
  "./content/lesson1.js", "./content/glossary.js",
  "./fonts/vazirmatn-latin.woff2", "./fonts/vazirmatn-arabic.woff2", "./fonts/nunito-700-latin.woff2",
  "./icons/favicon-32.png", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-192.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png",
  "./audio/manifest.json", "./app/audio.js"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;
  const p = url.pathname;
  const isMedia = /\.(woff2|png|jpg|jpeg|webp|svg|mp3|ogg|webm|m4a|json)$/i.test(p);
  if(p.endsWith(".js")){
    /* Network-first for all JS (app.js + content data): an updated file must
       reach returning visitors immediately. Cache stays as offline fallback. */
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=> caches.match(e.request).then(r=> r || caches.match("./index.html")))
    );
    return;
  }
  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put("./index.html", copy)).catch(()=>{});
        }
        return res;
      }).catch(()=> caches.match("./index.html"))
    );
    return;
  }
  /* Fonts, icons and audio: cache-first (they are versioned by the cache name),
     with network fill so new mp3s appear without a new release. */
  if(isMedia){
    e.respondWith(
      caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
        }
        return res;
      }))
    );
    return;
  }
  /* The rest of the shell (styles.css etc.): cache-first with network fill. */
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match("./index.html")))
  );
});
