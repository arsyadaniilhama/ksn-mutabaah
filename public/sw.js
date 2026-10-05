/*
 * Service worker ringan untuk PWA Mutabaah KSN.
 * Kebijakan aman untuk aplikasi Next.js dinamis:
 * - Semua request navigasi & API: network-first, jatuh ke cache hanya saat offline.
 * - Aset statis same-origin (_next/static, icons): cache-first dengan pembaruan diam-diam.
 * Tidak meng-cache lintas origin, tidak mengganggu server action.
 */
const CACHE = "ksn-mutabaah-v1";
const STATIC_HINTS = [/_next\/static\//, /^\/icons\//, /^\/manifest\.webmanifest$/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll([
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/icon-maskable-512.png",
        "/icons/apple-touch-icon.png",
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // biarkan API & server action murni jaringan (dengan fallback offline sederhana)
  const isApi = url.pathname.startsWith("/api/") || url.pathname.startsWith("/login");
  const isStatic = STATIC_HINTS.some((re) => re.test(url.pathname));

  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // network-first untuk navigasi & sisanya
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.mode === "navigate") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
          return ResponseOffline(isApi);
        }
        return Response.json({ error: "offline" }, { status: 503 });
      })
  );
});

function ResponseOffline(isApi) {
  return new Response(
    isApi
      ? JSON.stringify({ error: "Perangkat sedang offline." })
      : "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Offline</title><body style='font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#fafafa;color:#18181b'><div style='text-align:center'><h2 style='margin:0 0 8px'>Kamu sedang offline</h2><p style='margin:0;color:#52525B'>Koneksi internet diperlukan untuk memuat data mutabaah.</p></div>",
    {
      status: isApi ? 503 : 200,
      headers: { "Content-Type": isApi ? "application/json" : "text/html; charset=utf-8" },
    }
  );
}
