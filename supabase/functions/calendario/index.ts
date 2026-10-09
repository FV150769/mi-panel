// Edge Function "calendario": lee un calendario desde su link privado (.ics o webcal://) para "Tus calendarios" del panel.
// El navegador no lo puede pedir directo porque Google, iCloud y Outlook no lo permiten desde otras páginas (CORS),
// así que lo pide esta función y le devuelve el texto al panel, que es el que lo interpreta.
// Cuidados: solo para cuentas con sesión iniciada; solo https a nombres públicos (sin IPs, localhost ni puertos raros,
// ni nombres que apunten a direcciones internas); cada redirección se vuelve a revisar (hasta 3); como mucho 5 MB y
// 10 segundos; tiene que ser un calendario de verdad.
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// Errores pensados para mostrarle a la persona tal cual.
class Aviso extends Error {}

const MAX = 5_000_000;

function permitido(u: URL) {
  const h = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || (u.port && u.port !== "443") || u.username || u.password) return false;
  if (!h.includes(".") || h === "localhost" || /\.(localhost|local|internal|lan|home|corp)$/.test(h)) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return false; // IPs (v4 y v6)
  return true;
}

// Direcciones internas (de la red privada, del propio servidor o de la nube): un nombre público que apunte a una
// de estas (como los de *.nip.io) tampoco se lee.
function interna(ip: string) {
  const v4 = ip.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const x = ip.toLowerCase();
  return x === "::" || x === "::1" || /^f[cd]/.test(x) || /^fe[89ab]/.test(x);
}
async function apuntaAdentro(host: string) {
  const resolver = (Deno as any).resolveDns;
  if (typeof resolver !== "function") return false;
  const ips: string[] = [];
  for (const tipo of ["A", "AAAA"]) {
    try {
      ips.push(...await resolver(host, tipo));
    } catch {
      // sin registros de ese tipo
    }
  }
  return ips.some(interna);
}

async function leer(r: Response) {
  const rd = r.body!.getReader();
  const partes: Uint8Array[] = [];
  let n = 0;
  while (true) {
    const { done, value } = await rd.read();
    if (done) break;
    n += value.length;
    if (n > MAX) {
      await rd.cancel();
      throw new Aviso("El calendario es demasiado grande (más de 5 MB).");
    }
    partes.push(value);
  }
  const buf = new Uint8Array(n);
  let o = 0;
  for (const p of partes) {
    buf.set(p, o);
    o += p.length;
  }
  return new TextDecoder().decode(buf);
}

async function bajar(link: string) {
  let u: URL;
  try {
    u = new URL(link.trim().replace(/^webcals?:\/\//i, "https://"));
  } catch {
    throw new Aviso("Ese link no es válido: tiene que empezar con https:// o webcal://");
  }
  for (let i = 0; i < 4; i++) {
    if (!permitido(u)) throw new Aviso("Ese link no es válido: tiene que empezar con https:// o webcal://");
    if (await apuntaAdentro(u.hostname)) throw new Aviso("Ese link no es válido: tiene que ser de un calendario público en internet.");
    const r = await fetch(u, {
      redirect: "manual",
      headers: { "User-Agent": "Petaca/1.0 (+https://fv150769.github.io/petaca/)", "Accept": "text/calendar, */*" },
      signal: AbortSignal.timeout(10_000),
    });
    const loc = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && loc) {
      await r.body?.cancel();
      u = new URL(loc, u);
      continue;
    }
    if (!r.ok) {
      await r.body?.cancel();
      throw new Aviso(
        [401, 403, 404, 410].includes(r.status)
          ? "Ese link no abre ningún calendario. Revisá que lo hayas copiado completo y que siga compartido."
          : "El calendario respondió con un error (" + r.status + "). Probá más tarde.",
      );
    }
    const txt = await leer(r);
    if (!/BEGIN:VCALENDAR/i.test(txt.slice(0, 4000))) {
      throw new Aviso("Ese link no es de un calendario. Buscá el que termina en .ics (o empieza con webcal://).");
    }
    return txt;
  }
  throw new Aviso("El link redirige demasiadas veces.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Iniciá sesión primero" }, 401);
  let link = "";
  try {
    link = String((await req.json())?.url ?? "");
  } catch {
    // sin cuerpo: queda vacío
  }
  if (!link || link.length > 2000) return json({ error: "Falta el link del calendario" }, 400);
  try {
    return json({ ics: await bajar(link) });
  } catch (e) {
    if (e instanceof Aviso) return json({ error: e.message }, 400);
    if (e instanceof DOMException && e.name === "TimeoutError") {
      return json({ error: "El calendario tardó demasiado en responder. Probá de nuevo en un rato." }, 504);
    }
    return json({ error: "No pude conectarme con el calendario. Revisá el link." }, 502);
  }
});
