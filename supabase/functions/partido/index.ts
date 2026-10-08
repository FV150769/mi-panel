// Edge Function "partido": próximo partido, último resultado y posición en la tabla del equipo del usuario.
// Usa los datos públicos de ESPN (no piden clave). El navegador no los puede pedir directo porque ESPN no lo permite
// desde otras páginas (CORS), así que los pide esta función. Guarda cada respuesta 30 minutos para no repetir pedidos.
// No es una API oficial: si ESPN cambia o no responde, la página muestra un aviso y el resto de Petaca sigue igual.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Ligas que se buscan, en orden. Si el equipo cambió de categoría, se lo encuentra en la otra.
const LIGAS = ["arg.1", "arg.2"];
const CACHE = new Map<string, { t: number; d: unknown }>();
const DURA = 30 * 60 * 1000;

async function espn(u: string) {
  const r = await fetch("https://site.api.espn.com/" + u, {
    headers: { "User-Agent": "Mozilla/5.0 (Petaca)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error("ESPN " + r.status);
  return await r.json();
}

function nombre(t: any) {
  return String(t?.displayName || t?.shortDisplayName || "").replace(/\s*\(.*?\)\s*$/, "").trim();
}

function gol(x: any) {
  const s = x?.score;
  if (s == null) return null;
  return typeof s === "object" ? (s.displayValue ?? s.value ?? null) : s;
}

function partido(e: any, id: string) {
  const c = e?.competitions?.[0];
  if (!c) return null;
  const cs = c.competitors || [];
  const yo = cs.find((x: any) => String(x?.team?.id) === id);
  const ot = cs.find((x: any) => x !== yo);
  if (!yo || !ot) return null;
  return {
    f: e.date,
    loc: yo.homeAway === "home",
    riv: nombre(ot.team),
    est: c.status?.type?.state || "",
    gy: gol(yo),
    go: gol(ot),
  };
}

async function datos(lg0: string, id: string) {
  const ligas = [lg0, ...LIGAS.filter((l) => l !== lg0)];
  for (const lg of ligas) {
    const base = `apis/site/v2/sports/soccer/${lg}/teams/${id}/schedule`;
    const [fx, pa, st] = await Promise.all([
      espn(base + "?fixture=true").catch(() => ({})),
      espn(base).catch(() => ({})),
      espn(`apis/v2/sports/soccer/${lg}/standings`).catch(() => ({})),
    ]) as any[];
    const prox = (fx.events || []).map((x: any) => partido(x, id)).filter((p: any) => p && p.est !== "post")
      .sort((a: any, b: any) => (a.f < b.f ? -1 : 1));
    const jug = (pa.events || []).map((x: any) => partido(x, id)).filter((p: any) => p && p.est === "post")
      .sort((a: any, b: any) => (a.f < b.f ? -1 : 1));
    if (!prox.length && !jug.length) continue;
    let tb: any = null;
    const grupos = st.children?.length ? st.children : [st];
    for (const g of grupos) {
      const en = g?.standings?.entries || [];
      for (const x of en) {
        if (String(x?.team?.id) !== id) continue;
        const v: Record<string, unknown> = {};
        for (const s of x.stats || []) v[s.name] = s.value ?? s.displayValue;
        tb = {
          pos: Number(v.rank) || 0,
          pts: Number(v.points) || 0,
          pj: Number(v.gamesPlayed) || 0,
          g: Number(v.wins) || 0,
          e: Number(v.ties) || 0,
          p: Number(v.losses) || 0,
          zona: grupos.length > 1 ? String(g.name || "").replace(/^Group\s*/i, "Zona ") : "",
          n: en.length,
        };
      }
    }
    return { t: Date.now(), lg, prox: prox[0] || null, ult: jug[jug.length - 1] || null, tb };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Pedido inválido" }, 400);
  }
  const lg = String(body?.lg || "");
  const id = String(body?.id || "");
  if (!LIGAS.includes(lg) || !/^\d{1,6}$/.test(id)) return json({ error: "Equipo inválido" }, 400);
  const k = lg + "|" + id;
  const c = CACHE.get(k);
  if (c && Date.now() - c.t < DURA) return json(c.d);
  try {
    const d = await datos(lg, id);
    if (!d) return json({ error: "No encontré partidos de ese equipo" }, 404);
    CACHE.set(k, { t: Date.now(), d });
    return json(d);
  } catch (e) {
    if (c) return json(c.d);
    return json({ error: "ESPN no respondió: " + ((e as Error)?.message || e) }, 502);
  }
});
