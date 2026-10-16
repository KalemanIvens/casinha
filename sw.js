// Casinha: service worker simples. Rede primeiro; se estiver sem internet, usa a última cópia guardada.
const V = "casinha-v3";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-v2-192.png", "icon-v2-512.png", "apple-touch-icon-v2.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // Só guarda o próprio app, as fontes e o SDK do Firebase. Dados e login passam direto, sem cache.
  const ok = u.origin === location.origin ||
    u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com" ||
    (u.hostname === "www.gstatic.com" && u.pathname.startsWith("/firebasejs"));
  if (!ok) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
