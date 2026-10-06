// Edge Function "gemini": recibe el pedido del panel y lo manda a Gemini.
// La clave se guarda como secreto GEMINI_API_KEY en Supabase y nunca llega al navegador.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Iniciá sesión para usar la IA" }, 401);

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return json({ error: "Falta el secreto GEMINI_API_KEY en Supabase" }, 500);

  let prompt = "";
  try {
    prompt = String((await req.json()).prompt || "");
  } catch {
    return json({ error: "Pedido inválido" }, 400);
  }
  if (!prompt) return json({ error: "Falta el texto" }, 400);
  if (prompt.length > 20000) return json({ error: "La nota es demasiado larga" }, 400);

  // Si Gemini está saturado (503/429/500), reintenta y después prueba con un modelo más liviano.
  const intentos = [
    "gemini-flash-latest",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-flash-lite-latest",
  ];
  let d: any = {};
  let ok = false;
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
    d = await res.json().catch(() => ({}));
    if (res.ok) { ok = true; break; }
    if (![429, 500, 503].includes(res.status)) break;
  }
  if (!ok) return json({ error: d?.error?.message || "Gemini no respondió" }, 502);

  const text = (d?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .replace(/^```(json)?|```$/g, "")
    .trim();
  try {
    return json(JSON.parse(text));
  } catch {
    return json({ error: "Gemini no devolvió un JSON válido" }, 502);
  }
});
