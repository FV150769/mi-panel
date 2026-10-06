// Edge Function "gemini": recibe el pedido del panel y lo manda a Gemini.
// - Si el usuario cargó su propia clave (tabla ia_claves), se usa esa: tiene su propio cupo gratis de Google.
// - Si no, se usa la clave compartida (secreto GEMINI_API_KEY) con un límite de notas por día para cada usuario
//   (secreto opcional IA_LIMITE_DIARIO, por defecto 15), así nadie se come el cupo de todos.
// - Con {probar:true} solo verifica que la clave propia del usuario funcione.
// Solo responde a usuarios con sesión iniciada: se verifica el usuario (la clave pública sola no alcanza).
import { createClient } from "npm:@supabase/supabase-js@2";

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

// Llama a Gemini; si está saturado (503/429/500) reintenta y después prueba con un modelo más liviano.
async function llamar(key: string, prompt: string) {
  const intentos = [
    "gemini-flash-latest",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-flash-lite-latest",
  ];
  let d: any = {};
  let status = 0;
  for (let i = 0; i < intentos.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 800 * i));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${intentos[i]}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      },
    );
    status = res.status;
    d = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, d, status };
    if (![429, 500, 503].includes(res.status)) break;
  }
  return { ok: false, d, status };
}

// Traduce los errores de Google a algo entendible cuando la clave es del usuario.
function errorClavePropia(status: number, msg: string) {
  if (status === 400 && /api key/i.test(msg)) return "Tu clave de Gemini no es válida. Revisala en El vestuario → IA de Petaca.";
  if (status === 403) return "Tu clave de Gemini no tiene permiso para usar la API. Creá una nueva en aistudio.google.com.";
  if (status === 429) return "Se terminó el cupo gratis de tu clave de Gemini por hoy. Mañana se renueva.";
  return "Tu clave de Gemini: " + (msg || "Gemini no respondió");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Iniciá sesión para usar la IA" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Pedido inválido" }, 400);
  }

  const { data: fila } = await admin.from("ia_claves").select("clave").eq("user_id", u.user.id).maybeSingle();
  const propia = (fila?.clave as string | undefined) || "";

  // Botón "Guardar y probar": verifica la clave propia con un pedido mínimo.
  if (body?.probar === true) {
    if (!propia) return json({ error: "Todavía no guardaste tu clave." }, 400);
    const r = await llamar(propia, 'Devolvé exactamente este JSON: {"ok":true}');
    if (!r.ok) return json({ error: errorClavePropia(r.status, r.d?.error?.message || "") }, 502);
    return json({ ok: true });
  }

  const prompt = String(body?.prompt || "");
  if (!prompt) return json({ error: "Falta el texto" }, 400);
  if (prompt.length > 20000) return json({ error: "La nota es demasiado larga" }, 400);

  let key = propia;
  let usadas = 0;
  if (!key) {
    key = Deno.env.get("GEMINI_API_KEY") || "";
    if (!key) return json({ error: "Falta el secreto GEMINI_API_KEY en Supabase" }, 500);
    const { data: uso } = await admin.from("ia_uso").select("n").eq("user_id", u.user.id).eq("dia", hoyAR()).maybeSingle();
    usadas = uso?.n ?? 0;
    if (usadas >= LIMITE) {
      return json({
        error: "Llegaste a las " + LIMITE + " notas de hoy con la IA compartida. Cargá tu propia clave gratis en " +
          "El vestuario → IA de Petaca, o seguí mañana.",
      }, 429);
    }
  }

  const r = await llamar(key, prompt);
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
  // Solo las notas que salen bien cuentan para el límite de la clave compartida.
  if (!propia) {
    const { data: n } = await admin.rpc("ia_sumar", { uid: u.user.id, d: hoyAR() });
    usadas = typeof n === "number" ? n : usadas + 1;
  }
  if (out && typeof out === "object" && !Array.isArray(out)) {
    out._ia = propia ? { propia: true } : { propia: false, quedan: Math.max(0, LIMITE - usadas), limite: LIMITE };
  }
  return json(out);
});
