// Service worker de PETACA: que la app abra sin conexión y que lleguen los avisos al celular.
// - La página (index.html) se pide siempre a la red primero, así cada versión nueva entra apenas se publica; sin conexión
//   (o si la red tarda más de 4 segundos) se usa la última que se guardó.
// - Los archivos con versión (app.js?v=N, styles.css?v=N, imágenes, fuentes) se guardan la primera vez y después salen
//   del celular al instante. Cada versión nueva de este archivo arranca con un depósito limpio.
// - Supabase, el dólar y todo lo demás van siempre a la red (nunca se guardan).
// - Si el navegador no deja guardar (navegación privada, sin espacio), igual se instala: todo va a la red y los avisos andan.
const VERSION = "v77";
const CACHE = "petaca-" + VERSION;
const BASE = new URL("./", self.location).href;

async function deposito() {
  try {
    return await caches.open(CACHE);
  } catch {
    return null;
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await deposito();
    if (c) {
      try {
        const r = await fetch(BASE, { cache: "no-cache" });
        if (r.ok) {
          const html = await r.clone().text();
          await c.put(BASE, r);
          const urls = new Set(["manifest.webmanifest?v=31", "icons/icon-192.png?v=29", "icons/favicon-32.png?v=29"]);
          for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) if (!/^(https?:|data:|mailto:)/.test(m[1])) urls.add(m[1]);
          await Promise.all([...urls].map((u) => c.add(new URL(u, BASE).href).catch(() => {})));
        }
      } catch {
        // sin red al instalar: se guarda lo que se vaya pidiendo
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try {
      for (const k of await caches.keys()) if (k.startsWith("petaca-") && k !== CACHE) await caches.delete(k);
    } catch {
      // sin depósito: nada que limpiar
    }
    await self.clients.claim();
  })());
});

async function pagina(req) {
  const c = await deposito();
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(req.url, { cache: "no-cache", credentials: "same-origin", signal: ctl.signal });
    clearTimeout(t);
    if (c && r.ok && new URL(req.url).pathname === new URL(BASE).pathname) c.put(BASE, r.clone()).catch(() => {});
    return r;
  } catch {
    const hay = c ? await c.match(BASE) : null;
    return hay || new Response("Sin conexión. Abrí Petaca de nuevo cuando vuelva internet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function guardado(req) {
  const c = await deposito();
  const hay = c ? await c.match(req).catch(() => null) : null;
  if (hay) return hay;
  const r = await fetch(req);
  if (c && (r.ok || r.type === "opaque")) c.put(req, r.clone()).catch(() => {});
  return r;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (req.mode === "navigate") return e.respondWith(pagina(req));
  if (u.origin === self.location.origin) {
    // La búsqueda de versión nueva (?nv=…) va siempre a la red
    if (u.searchParams.has("nv") || u.pathname.endsWith("/sw.js")) return;
    return e.respondWith(guardado(req));
  }
  if (u.origin === "https://fonts.googleapis.com" || u.origin === "https://fonts.gstatic.com") e.respondWith(guardado(req));
});

// Avisos al celular (los manda la función "avisos"): {t: título, b: texto, tag}
self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { b: e.data ? e.data.text() : "" };
  }
  e.waitUntil(self.registration.showNotification(d.t || "PETACA", {
    body: d.b || "",
    tag: d.tag || undefined,
    icon: "icons/icon-192.png?v=29",
    badge: "icons/favicon-32.png?v=29",
    lang: "es-AR",
    data: { url: BASE },
  }));
});

// Tocar el aviso abre Petaca (o la trae al frente si ya estaba abierta).
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ws = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of ws) if ("focus" in w) return w.focus();
    return self.clients.openWindow(BASE);
  })());
});
