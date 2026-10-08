// Edge Function "gemini": recibe el pedido del panel y lo manda a Gemini.
// - Si el usuario cargó su propia clave (tabla ia_claves), se usa esa: tiene su propio cupo gratis de Google.
// - Si no, se usa la clave compartida (secreto GEMINI_API_KEY) con un límite de notas por día para cada usuario
//   (secreto opcional IA_LIMITE_DIARIO, por defecto 15), así nadie se come el cupo de todos.
// - Con {probar:true} solo verifica que la clave propia del usuario funcione.
// - Con {ping:true} despierta la función (el panel la llama al tocar el cuadro de la nota, así no arranca en frío)
//   y deja lista la sesión, la clave propia y el cupo del día, así la nota no espera a la base de datos.
// Solo responde a usuarios con sesión iniciada: se verifica el usuario (la clave pública sola no alcanza).
// Para que sea rápido, la sesión, la clave propia y el cupo del día se consultan a la vez (y se recuerdan unos
// minutos), y el cupo se suma después de responder. La respuesta trae _t con los tiempos (preparación, Gemini,
// modelo y cada intento) para medir.
import { createClient } from "npm:@supabase/supabase-js@2";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// Usuario del token y hasta cuándo vale, sin ir a la red (después se confirma con Supabase Auth antes de usar la IA).
function usuarioDe(jwt: string): { uid: string; exp: number } {
  try {
    const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const c = JSON.parse(atob(p + "=".repeat((4 - p.length % 4) % 4)));
    const uid = c?.role === "authenticated" && typeof c.sub === "string" ? c.sub : "";
    return { uid, exp: Number(c?.exp) * 1000 || 0 };
  } catch {
    return { uid: "", exp: 0 };
  }
}

// Lo que ya se sabe de cada usuario, por unos minutos: la sesión confirmada, su clave propia y cuántas notas usó hoy
// con la compartida. El ping (cuando la persona toca el cuadro de la nota) lo deja listo, así al mandar la nota no se
// espera a la base de datos. Con fresco se vuelve a leer (al probar o quitar la clave propia).
const VIVE = 5 * 60 * 1000;
const sesiones = new Map<string, { uid: string; hasta: number }>();
const datos = new Map<string, { clave: string; dia: string; n: number; hasta: number }>();
function podar(m: Map<string, { hasta: number }>) {
  if (m.size < 500) return;
  const ahora = Date.now();
  for (const [k, v] of m) if (v.hasta <= ahora) m.delete(k);
}
async function preparar(jwt: string, u: { uid: string; exp: number }, fresco = false) {
  const ahora = Date.now();
  const dia = hoyAR();
  const s = sesiones.get(jwt);
  const d = datos.get(u.uid);
  const okS = !!s && s.uid === u.uid && s.hasta > ahora;
  const okD = !fresco && !!d && d.hasta > ahora && d.dia === dia;
  if (okS && okD) return { ok: true, clave: d!.clave, usadas: d!.n };
  const [ses, cla, uso] = await Promise.all([
    okS ? null : sb.auth.getUser(jwt),
    okD ? null : admin.from("ia_claves").select("clave").eq("user_id", u.uid).maybeSingle(),
    okD ? null : admin.from("ia_uso").select("n").eq("user_id", u.uid).eq("dia", dia).maybeSingle(),
  ]);
  if (!okS) {
    if (ses?.data?.user?.id !== u.uid) return { ok: false, clave: "", usadas: 0 };
    podar(sesiones);
    sesiones.set(jwt, { uid: u.uid, hasta: Math.min(ahora + VIVE, u.exp || ahora + VIVE) });
  }
  if (okD) return { ok: true, clave: d!.clave, usadas: d!.n };
  const clave = (cla?.data?.clave as string | undefined) || "";
  const n = (uso?.data?.n as number | undefined) ?? 0;
  if (!cla?.error && !uso?.error) {
    podar(datos);
    datos.set(u.uid, { clave, dia, n, hasta: ahora + VIVE });
  }
  return { ok: true, clave, usadas: n };
}

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

const LIMITE = Math.max(1, Number(Deno.env.get("IA_LIMITE_DIARIO")) || 15);

// Día actual en Argentina (UTC-3, sin horario de verano)
function hoyAR() {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

// Llama a Gemini; si está saturado (503/429/500) o tarda, reintenta y después prueba con el otro modelo.
// Notas comunes: primero Flash-Lite, que es el más rápido. Correcciones, cancelaciones y audio: primero Flash, que entiende mejor.
// Pensando lo mínimo responde mucho más rápido. Cada modelo acepta una forma distinta de pedirlo, así que se prueban
// en orden y, si el modelo rechaza la opción (error 400), se pasa a la siguiente; la última es sin opción.
// La que funcionó se recuerda por modelo mientras la función siga activa.
// Cada intento tiene hasta 9 s (12 s con audio) y en total no se esperan más de 20 s, para que la página no quede colgada.
const PENSAR: (Record<string, unknown> | null)[] = [{ thinkingLevel: "minimal" }, { thinkingBudget: 0 }, null];
const pensarOk: Record<string, number> = {};
async function llamar(key: string, prompt: string, audio?: { mime: string; data: string }, rapido = false) {
  const intentos = rapido
    ? ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-flash-latest"]
    : ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-flash-lite-latest"];
  const fin = Date.now() + 20000;
  let d: any = {};
  let status = 0;
  // Cada intento queda anotado (modelo:estado:ms) para ver en las medidas por qué una nota tardó.
  const pasos: string[] = [];
  // Claves nuevas "AQ." (desde mayo de 2026): si Google rechaza el encabezado de siempre con 401, se prueba una vez como Bearer.
  let bearer = false;
  let probeBearer = key.startsWith("AQ.");
  for (let i = 0; i < intentos.length; i++) {
    const modelo = intentos[i];
    const pv = pensarOk[modelo] ?? 0;
    if (i > 0 && status !== 400) await new Promise((r) => setTimeout(r, 300));
    const queda = fin - Date.now();
    if (queda < 3000) break;
    const gen: any = { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 4096 };
    if (PENSAR[pv]) gen.thinkingConfig = PENSAR[pv];
    let res: Response;
    const ti = Date.now();
    const corto = modelo.replace(/^gemini-|-latest$/g, "");
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: "POST",
          headers: bearer
            ? { "Content-Type": "application/json", "Authorization": "Bearer " + key }
            : { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ parts: audio ? [{ inline_data: { mime_type: audio.mime, data: audio.data } }, { text: prompt }] : [{ text: prompt }] }],
            generationConfig: gen,
          }),
          signal: AbortSignal.timeout(Math.min(audio ? 12000 : 9000, queda)),
        },
      );
    } catch {
      status = 504;
      d = { error: { message: "Gemini tardó demasiado en responder" } };
      pasos.push(corto + ":504:" + (Date.now() - ti));
      continue;
    }
    status = res.status;
    d = await res.json().catch(() => ({}));
    pasos.push(corto + ":" + status + ":" + (Date.now() - ti));
    if (res.ok) {
      pensarOk[modelo] = pv;
      return { ok: true, d, status, modelo, pasos };
    }
    if (res.status === 401 && probeBearer) {
      probeBearer = false;
      bearer = true;
      i--;
      continue;
    }
    // Opción de pensamiento no aceptada: mismo modelo con la siguiente forma (no cuenta como intento).
    // Un 400 por la clave inválida no se reintenta.
    if (res.status === 400 && pv < PENSAR.length - 1 && !/api key/i.test(d?.error?.message || "")) {
      pensarOk[modelo] = pv + 1;
      i--;
      continue;
    }
    if (![429, 500, 503].includes(res.status)) break;
  }
  return { ok: false, d, status, modelo: "", pasos };
}

// Traduce los errores de Google a algo entendible cuando la clave es del usuario.
function errorClavePropia(status: number, msg: string) {
  if (status === 400 && /api key/i.test(msg)) return "Tu clave de Gemini no es válida. Revisala en Configuración → IA de Petaca.";
  if (status === 401) {
    return "Google rechazó tu clave de Gemini (pasa con algunas claves nuevas que empiezan con AQ.). Probá crear la clave en un proyecto nuevo de AI Studio, o quitala y usá la IA compartida.";
  }
  if (status === 403) return "Tu clave de Gemini no tiene permiso para usar la API. Creá una nueva en aistudio.google.com.";
  if (status === 429) return "Se terminó el cupo gratis de tu clave de Gemini por hoy. Mañana se renueva.";
  return "Tu clave de Gemini: " + (msg || "Gemini no respondió");
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Pedido inválido" }, 400);
  }
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const u = usuarioDe(jwt);
  // Despertar: no toca la IA; si hay sesión, deja listos la sesión, la clave y el cupo para la nota que viene.
  if (body?.ping === true) {
    if (u.uid) await preparar(jwt, u, body?.fresco === true).catch(() => {});
    return json({ ok: true });
  }

  if (!u.uid) return json({ error: "Iniciá sesión para usar la IA" }, 401);
  const uid = u.uid;
  // A la vez: confirmar la sesión, la clave propia y lo usado hoy con la clave compartida (o lo que dejó listo el ping).
  const pre = await preparar(jwt, u, body?.probar === true);
  if (!pre.ok) return json({ error: "Iniciá sesión para usar la IA" }, 401);
  const propia = pre.clave;

  // Botón "Guardar y probar": verifica la clave propia con un pedido mínimo.
  if (body?.probar === true) {
    if (!propia) return json({ error: "Todavía no guardaste tu clave." }, 400);
    const r = await llamar(propia, 'Devolvé exactamente este JSON: {"ok":true}', undefined, true);
    if (!r.ok) return json({ error: errorClavePropia(r.status, r.d?.error?.message || "") }, 502);
    return json({ ok: true });
  }

  // Nota de voz: si el navegador no sabe pasar la voz a texto, la página manda el audio.
  // Con el pedido de la nota, Gemini la escucha y la entiende en un solo paso (y devuelve "texto" con lo que dijo);
  // sin pedido (versiones viejas del panel), solo la transcribe.
  let audio: { mime: string; data: string } | undefined;
  if (body?.audio) {
    const mime = String(body?.mime || "").split(";")[0];
    const data = String(body.audio);
    if (!/^audio\/[a-z0-9.+-]+$/i.test(mime)) return json({ error: "Formato de audio no soportado" }, 400);
    if (data.length > 3_000_000) return json({ error: "El audio es demasiado largo (máximo un par de minutos)" }, 400);
    audio = { mime, data };
  }
  const pedido = String(body?.prompt || "");
  const prompt = audio
    ? pedido
      ? pedido +
        ' La nota está en el audio adjunto: entendela igual que si estuviera escrita y agregá "texto": lo que dice la persona, tal cual (montos con números, ej: "8 mil"). Si no se entiende nada, devolvé {"texto": ""}.'
      : 'Transcribí este audio en español rioplatense tal cual lo dice la persona (montos con números, ej: "8 mil"). Devolvé SOLO un JSON: {"texto": string}. Si no se entiende nada, {"texto": ""}.'
    : pedido;
  if (!prompt) return json({ error: "Falta el texto" }, 400);
  if (prompt.length > 20000) return json({ error: "La nota es demasiado larga" }, 400);

  let key = propia;
  let usadas = 0;
  if (!key) {
    key = Deno.env.get("GEMINI_API_KEY") || "";
    if (!key) return json({ error: "Falta el secreto GEMINI_API_KEY en Supabase" }, 500);
    usadas = pre.usadas;
    if (usadas >= LIMITE) {
      return json({
        error: "Llegaste a las " + LIMITE + " notas de hoy con la IA compartida. Cargá tu propia clave gratis en " +
          "Configuración → IA de Petaca, o seguí mañana.",
      }, 429);
    }
  }

  const t1 = Date.now();
  const r = await llamar(key, prompt, audio, body?.rapido === true && !audio);
  const t2 = Date.now();
  if (!r.ok) {
    const msg = r.d?.error?.message || "Gemini no respondió";
    return json({ error: propia ? errorClavePropia(r.status, msg) : msg }, 502);
  }

  const text = (r.d?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .replace(/^```(json)?|```$/g, "")
    .trim();
  let out: any;
  try {
    out = JSON.parse(text);
  } catch {
    return json({ error: "Gemini no devolvió un JSON válido" }, 502);
  }
  // Solo las notas que salen bien cuentan para el límite de la clave compartida. Se suma después de responder.
  if (!propia) {
    const suma = admin.rpc("ia_sumar", { uid, d: hoyAR() }).then(() => {}, () => {});
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(suma);
    else await suma;
    usadas += 1;
    const d = datos.get(uid);
    if (d && d.dia === hoyAR()) d.n = usadas;
  }
  if (out && typeof out === "object" && !Array.isArray(out)) {
    out._ia = propia ? { propia: true } : { propia: false, quedan: Math.max(0, LIMITE - usadas), limite: LIMITE };
    out._t = { prep: t1 - t0, ia: t2 - t1, modelo: r.modelo, pasos: r.pasos.join(" ") };
  }
  return json(out);
});
