// Edge Function "gemini": recibe la nota del panel, arma el pedido y lo manda a Gemini.
// - Si el usuario cargó su propia clave (tabla ia_claves), se usa esa: tiene su propio cupo gratis de Google.
// - Si no, se usa la clave compartida (secreto GEMINI_API_KEY) con un límite de notas por día para cada usuario
//   (secreto opcional IA_LIMITE_DIARIO, por defecto 15) y otro para todos juntos (IA_LIMITE_GLOBAL, por defecto 400).
//   La compartida pide el email confirmado, así no se puede crear cuentas de a montones para gastarla.
// - Las instrucciones para la IA viven acá: la página manda solo la nota y sus datos (categorías, lo cargado, etc.).
//   Y de la respuesta se devuelven solo las claves que entiende el panel, con textos cortos: así la IA del panel no sirve
//   para pedirle cualquier otra cosa.
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

// Las instrucciones fijas (iguales en todas las notas, así Gemini las reutiliza y responde antes).
const FIJO = "Extraé de una nota en español rioplatense los gastos en pesos, los eventos y, si aparecen, ingresos en pesos o un aporte de ahorro en dólares (negativo si retira plata del ahorro). Devolvé SOLO un JSON compacto y SOLO con las claves que tengan algo: no pongas listas vacías, null ni campos vacíos. Claves posibles: \"gastos\":[{\"monto\":number,\"categoria\":una de las categorías del usuario,\"detalle\":string,\"fecha\":\"YYYY-MM-DD\",\"medio\":\"efectivo\" o \"transferencia\" (solo si lo dice)}], \"eventos\":[{\"fecha\":\"YYYY-MM-DD\",\"hora\":\"HH:MM\" (solo si la dice),\"titulo\":string,\"imp\":true (solo si pide que le avisen o dice que es importante)}], \"ingresos\":[{\"monto\":number,\"fecha\":\"YYYY-MM-DD\",\"medio\":\"efectivo\" o \"transferencia\" (solo si lo dice),\"porcentaje_ahorro\":number (solo si la nota dice cuánto separar de ese ingreso)}], \"movimientos\":[{\"monto\":number,\"a\":\"efectivo\" si sacó plata del cajero o del banco, \"transferencia\" si depositó o cargó efectivo en el banco o la billetera virtual,\"fecha\":\"YYYY-MM-DD\"}], \"ahorro_usd\":number, \"cotizacion\":number. Si pide pasar AHORA al ahorro una parte de la plata que ya tiene (ej: 'ahorrá el 10% de lo que tengo', 'separá 50 mil para el ahorro'), devolvé \"separar\":{\"porcentaje\":number o \"monto\":number en pesos,\"de\":\"efectivo\" o \"transferencia\" (solo si lo dice),\"a\":\"inversiones\" si dice invertir (plazo fijo, FCI, acciones, cedears, cripto) o \"ahorro\"}; no lo confundas con el % que separa de cada ingreso (eso es un ajuste). Invertir NO es un gasto. Si saca plata de sus inversiones y vuelve a su día a día (rescató el FCI, venció el plazo fijo), devolvé \"rescatar\":number en pesos. Para los gastos usá SIEMPRE una de las categorías del usuario (la más parecida por el detalle); si ninguna encaja, Otros. Si la nota pide CAMBIAR un ajuste (el presupuesto de una categoría, crear, renombrar o quitar una categoría, el % que separa de cada ingreso o el objetivo de ahorro), devolvé \"ajustes\":{\"categorias\":[{\"nombre\":categoría actual o nueva,\"presupuesto\":number nuevo por mes (solo si cambia),\"nuevo_nombre\":string (solo si la renombra),\"quitar\":true (solo si la quiere borrar)}],\"porcentaje_ahorro\":number,\"objetivo\":{\"nombre\":string,\"meta_usd\":number,\"fecha_limite\":\"YYYY-MM-DD\"}} con solo lo que cambia. Tarjeta de débito, Mercado Pago, billetera virtual, QR o banco cuentan como transferencia; billetes o 'en mano' como efectivo. Sacar plata del cajero no es un gasto: va en movimientos. Si algo no tiene fecha, usá la de hoy. 'mil' vale 1000; '5,000' y '5.000' son cinco mil (la coma o el punto separan los miles), '1,5 palos' es 1500000. Si la nota cancela o borra algo, devolvé \"cancelar\":[ids de la lista de lo cargado]. Las rutinas (ids que empiezan con R) se repiten todas las semanas: si cancela SOLO un día de una rutina (ej: 'este jueves no hay gym', 'mañana no voy a inglés', 'se suspende el fútbol del sábado'), NO pongas su id en cancelar: devolvé \"cancelar_fecha\":[{\"id\":id de la rutina,\"fecha\":\"YYYY-MM-DD\" del día que no va, que tiene que caer en el día de la semana de esa rutina; si no dice cuál, el próximo}]. Poné el id de una rutina en cancelar solo si la deja del todo (ej: 'ya no voy más al gym', 'dejé inglés', 'borrá la rutina de fútbol'). Si dice que no va a NINGUNA clase o actividad algún día (ej: 'mañana no tengo clases'), devolvé \"sin_clases\":[\"YYYY-MM-DD\"]. Si algo se repite todas las semanas o todos los días, devolvé \"rutinas\":[{\"dias\":[números de 0 a 6, 0=domingo, 1=lunes… 6=sábado; 'todos los días' = [0,1,2,3,4,5,6], 'de lunes a viernes' = [1,2,3,4,5]],\"hora\":\"HH:MM\" de inicio,\"hasta\":\"HH:MM\" (solo si dice hasta qué hora),\"titulo\":string}] (no lo pongas también en eventos). Si la nota dice que algo YA cargado está mal (me equivoqué, era, no eran, en realidad, corregí, cambiá, pasalo a), NO lo cargues de nuevo ni lo canceles: devolvé \"corregir\":[{\"id\":id de la lista de lo cargado, y SOLO los campos que cambian entre \"monto\":number, \"categoria\", \"detalle\", \"fecha\":\"YYYY-MM-DD\", \"medio\":\"efectivo\" o \"transferencia\" (en un movimiento es hacia dónde fue la plata), \"titulo\", \"hora\":\"HH:MM\", \"porcentaje_ahorro\":number de 0 a 100}].";

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

// Lo que ya se sabe de cada usuario, por unos minutos: la sesión confirmada (y si confirmó su email), su clave propia y
// cuántas notas usó hoy con la compartida. El ping (cuando la persona toca el cuadro de la nota) lo deja listo, así al
// mandar la nota no se espera a la base de datos. Con fresco se vuelve a leer (al probar o quitar la clave propia).
const VIVE = 5 * 60 * 1000;
const sesiones = new Map<string, { uid: string; conf: boolean; hasta: number }>();
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
  if (okS && okD) return { ok: true, conf: s!.conf, clave: d!.clave, usadas: d!.n };
  const [ses, cla, uso] = await Promise.all([
    okS ? null : sb.auth.getUser(jwt),
    okD ? null : admin.from("ia_claves").select("clave").eq("user_id", u.uid).maybeSingle(),
    okD ? null : admin.from("ia_uso").select("n").eq("user_id", u.uid).eq("dia", dia).maybeSingle(),
  ]);
  let conf = okS ? s!.conf : false;
  if (!okS) {
    const usr = ses?.data?.user;
    if (usr?.id !== u.uid) return { ok: false, conf: false, clave: "", usadas: 0 };
    conf = !!usr.email_confirmed_at;
    podar(sesiones);
    sesiones.set(jwt, { uid: u.uid, conf, hasta: Math.min(ahora + VIVE, u.exp || ahora + VIVE) });
  }
  if (okD) return { ok: true, conf, clave: d!.clave, usadas: d!.n };
  const clave = (cla?.data?.clave as string | undefined) || "";
  const n = (uso?.data?.n as number | undefined) ?? 0;
  if (!cla?.error && !uso?.error) {
    podar(datos);
    datos.set(u.uid, { clave, dia, n, hasta: ahora + VIVE });
  }
  return { ok: true, conf, clave, usadas: n };
}

// Notas de hoy con la clave compartida, entre todos (se recuerda un minuto).
const LIMITE_TOTAL = Math.max(1, Number(Deno.env.get("IA_LIMITE_GLOBAL")) || 400);
let total = { dia: "", n: 0, hasta: 0 };
async function usadasHoy(dia: string) {
  if (total.dia === dia && total.hasta > Date.now()) return total.n;
  const { data, error } = await admin.from("ia_uso").select("n").eq("dia", dia);
  if (error) return 0;
  const n = (data ?? []).reduce((s: number, r: any) => s + (Number(r.n) || 0), 0);
  total = { dia, n, hasta: Date.now() + 60_000 };
  return n;
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

// Arma el pedido para Gemini: las instrucciones fijas, los datos del usuario y la nota.
// Las páginas viejas (hasta que se actualizan solas) mandaban el pedido ya armado: se acepta solo si empieza con las
// mismas instrucciones.
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function texto(x: unknown, n: number) {
  return String(x ?? "").replace(/[\u0000-\u0009\u000b-\u001f]+/g, " ").slice(0, n);
}
function armar(body: any): string | null {
  if (typeof body?.nota === "string") {
    const c = body.ctx && typeof body.ctx === "object" ? body.ctx : {};
    const hoyS = hoyAR();
    const hoy = /^\d{4}-\d{2}-\d{2}$/.test(c.hoy ?? "") && Math.abs(Date.parse(c.hoy) - Date.parse(hoyS)) <= 2 * 864e5 ? c.hoy : hoyS;
    const cats = (Array.isArray(c.cats) ? c.cats : []).slice(0, 60)
      .map((x: any) => texto(x?.[0], 40).replace(/\n/g, " ") + " " + (Number(x?.[1]) > 0 ? "$" + Math.round(Number(x[1])) : "sin presupuesto"))
      .join(", ") || "Otros sin presupuesto";
    const aho = Math.min(100, Math.max(0, Number(c.aho) || 0));
    const ob = c.obj && typeof c.obj === "object" ? c.obj : {};
    const conLista = c.conLista === true;
    return FIJO + " DATOS DEL USUARIO. Hoy es " + hoy + " (" + DIAS[new Date(hoy + "T12:00:00Z").getUTCDay()] + "). " +
      "Categorías y presupuesto por mes: " + cats + ". Separa el " + aho + "% de cada ingreso para ahorro. " +
      "Objetivo de ahorro \"" + texto(ob.x, 80).replace(/\n/g, " ") + "\" de US$" + (Number(ob.target) || 0) +
      (/^\d{4}-\d{2}-\d{2}$/.test(ob.hasta ?? "") ? " hasta el " + ob.hasta : " sin plazo") + "." + texto(c.apr, 3000) +
      " Lista de lo cargado (id: qué es): " + (conLista ? texto(c.lista, 15000) || "(nada)" : "(no hace falta para esta nota)") + "." +
      (conLista ? texto(c.ult, 600) : "") + " NOTA: " + texto(body.nota, 4000);
  }
  if (typeof body?.prompt === "string" && body.prompt.startsWith(FIJO)) return body.prompt;
  return null;
}

// De la respuesta quedan solo las claves que usa el panel, con listas y textos cortos.
const CLAVES = new Set(["gastos", "eventos", "ingresos", "movimientos", "ahorro_usd", "cotizacion", "separar", "rescatar",
  "ajustes", "cancelar", "cancelar_fecha", "sin_clases", "rutinas", "corregir", "texto"]);
function limpiar(x: any, prof = 0, clave = ""): any {
  if (prof > 5) return null;
  if (typeof x === "string") return x.slice(0, clave === "texto" ? 2000 : 200);
  if (typeof x === "number" || typeof x === "boolean" || x === null) return x;
  if (Array.isArray(x)) return x.slice(0, 40).map((v) => limpiar(v, prof + 1, clave));
  if (typeof x === "object") {
    const o: any = {};
    for (const [k, v] of Object.entries(x).slice(0, 30)) {
      if (prof === 0 && !CLAVES.has(k)) continue;
      o[k] = limpiar(v, prof + 1, k);
    }
    return o;
  }
  return null;
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
  // Con la nota, Gemini la escucha y la entiende en un solo paso (y devuelve "texto" con lo que dijo);
  // sin nota (versiones viejas del panel), solo la transcribe.
  let audio: { mime: string; data: string } | undefined;
  if (body?.audio) {
    const mime = String(body?.mime || "").split(";")[0];
    const data = String(body.audio);
    if (!/^audio\/[a-z0-9.+-]+$/i.test(mime)) return json({ error: "Formato de audio no soportado" }, 400);
    if (data.length > 3_000_000) return json({ error: "El audio es demasiado largo (máximo un par de minutos)" }, 400);
    audio = { mime, data };
  }
  const pedido = armar(body);
  if (pedido === null && !(audio && body?.prompt == null && body?.nota == null)) {
    return json({ error: "Pedido inválido: actualizá Petaca (cerrala y abrila de nuevo)." }, 400);
  }
  const prompt = audio
    ? pedido
      ? pedido +
        ' La nota está en el audio adjunto: entendela igual que si estuviera escrita y agregá "texto": lo que dice la persona, tal cual (montos con números, ej: "8 mil"). Si no se entiende nada, devolvé {"texto": ""}.'
      : 'Transcribí este audio en español rioplatense tal cual lo dice la persona (montos con números, ej: "8 mil"). Devolvé SOLO un JSON: {"texto": string}. Si no se entiende nada, {"texto": ""}.'
    : pedido!;
  if (!prompt) return json({ error: "Falta el texto" }, 400);
  if (prompt.length > 24000) return json({ error: "La nota es demasiado larga" }, 400);

  let key = propia;
  let usadas = 0;
  const dia = hoyAR();
  if (!key) {
    key = Deno.env.get("GEMINI_API_KEY") || "";
    if (!key) return json({ error: "Falta el secreto GEMINI_API_KEY en Supabase" }, 500);
    if (!pre.conf) {
      return json({ error: "Para usar la IA compartida, confirmá tu email (te mandamos un mail al registrarte). O cargá tu propia clave gratis en Configuración → IA de Petaca." }, 403);
    }
    usadas = pre.usadas;
    if (usadas >= LIMITE) {
      return json({
        error: "Llegaste a las " + LIMITE + " notas de hoy con la IA compartida. Cargá tu propia clave gratis en " +
          "Configuración → IA de Petaca, o seguí mañana.",
      }, 429);
    }
    if (await usadasHoy(dia) >= LIMITE_TOTAL) {
      return json({ error: "La IA compartida llegó al límite de hoy para todos. Cargá tu propia clave gratis en Configuración → IA de Petaca, o seguí mañana." }, 429);
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
  if (!out || typeof out !== "object" || Array.isArray(out)) return json({ error: "Gemini no devolvió un JSON válido" }, 502);
  out = limpiar(out);
  // Solo las notas que salen bien cuentan para el límite de la clave compartida. Se suma después de responder.
  if (!propia) {
    const suma = Promise.resolve(admin.rpc("ia_sumar", { uid, d: dia })).then(() => {}, () => {});
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(suma);
    else await suma;
    usadas += 1;
    total.n += 1;
    const d = datos.get(uid);
    if (d && d.dia === dia) d.n = usadas;
  }
  out._ia = propia ? { propia: true } : { propia: false, quedan: Math.max(0, LIMITE - usadas), limite: LIMITE };
  out._t = { prep: t1 - t0, ia: t2 - t1, modelo: r.modelo, pasos: r.pasos.join(" ") };
  return json(out);
});
