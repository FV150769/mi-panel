// Edge Function "gemini": recibe el pedido del panel y lo manda a Gemini.
// La clave se guarda como secreto GEMINI_API_KEY en Supabase y nunca llega al navegador.
// Solo responde a usuarios con sesión iniciada (Supabase verifica el JWT antes de llegar acá).

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

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    },
  );
  const d = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: d?.error?.message || `Gemini respondió ${res.status}` }, 502);

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
