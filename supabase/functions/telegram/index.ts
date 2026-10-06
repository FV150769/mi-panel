// Edge Function "telegram": manda un mensaje de prueba al chat ID que el usuario guardó en el panel.
// Lee el chat ID de los datos del propio usuario (RLS), así nadie puede mandar mensajes a chats ajenos.
// El token del bot vive como secreto TELEGRAM_BOT_TOKEN en Supabase.
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

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return json({ error: "Falta el secreto TELEGRAM_BOT_TOKEN en Supabase" }, 500);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return json({ error: "Iniciá sesión primero" }, 401);

  const { data, error } = await sb.from("panel_state").select("data").eq("user_id", u.user.id).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  const chat = data?.data?.cfg?.TGCHAT;
  if (!chat) return json({ error: "No hay chat ID guardado" }, 400);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: "✅ Mi panel: los avisos por Telegram están funcionando." }),
  });
  const d = await res.json().catch(() => ({}));
  if (!d.ok) {
    const msg = String(d.description || res.status);
    return json({
      error: /chat not found|bot was blocked/i.test(msg)
        ? "Telegram no encuentra tu chat. Abrí el bot del panel y tocá Iniciar, y revisá el chat ID."
        : "Telegram: " + msg,
    }, 502);
  }
  return json({ ok: true });
});
