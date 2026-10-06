const CACHE = "eng2-v5";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js",
  "./content/glossary.js", "./content/audio.js", "./content/lesson1.js"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if(url.origin === self.location.origin && url.pathname.endsWith(".js")){
    // Network-first for all JS (app.js + content data): an updated file must
    // reach returning visitors immediately instead of being masked by a stale
    // cached copy. Cache is kept as the offline fallback.
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
  // Cache-first for the app shell, with network fill.
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match("./index.html")))
  );
});