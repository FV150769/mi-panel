// Edge Function de avisos (la corre el cron): manda por Telegram los eventos marcados con 🔔,
// 7 días y 1 día antes, cada uno al chat ID que esa cuenta guardó en el panel (Avisos por Telegram).
import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function tg(method: string, body: unknown) {
  const r = await fetch("https://api.telegram.org/bot" + TOKEN + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return await r.json();
}

async function once(key: string): Promise<boolean> {
  const { data } = await sb.from("avisos_enviados").select("k").eq("k", key).maybeSingle();
  if (data) return false;
  await sb.from("avisos_enviados").insert({ k: key });
  return true;
}

Deno.serve(async () => {
  if (!TOKEN) return new Response("Falta el secreto TELEGRAM_BOT_TOKEN", { status: 500 });

  // 1) A quien le escriba al bot, le contesta con su chat ID para que lo pegue en el panel.
  //    (Ya no se guarda como "el chat" de nadie: cada cuenta usa el que cargó en el panel.)
  const up = await tg("getUpdates", { timeout: 0 });
  const msgs = (up.result ?? []).filter((u: any) => u.message?.chat?.id);
  const respondidos = new Set<number>();
  for (const u of msgs) {
    const id = u.message.chat.id;
    if (respondidos.has(id)) continue;
    respondidos.add(id);
    await tg("sendMessage", {
      chat_id: id,
      text: "Hola! Tu chat ID es " + id + ". Pegalo en Mi panel → Avisos por Telegram y tocá Guardar.",
    });
  }
  if (msgs.length) await tg("getUpdates", { offset: msgs[msgs.length - 1].update_id + 1, timeout: 0 });

  // 2) Fecha de hoy en Argentina (UTC-3)
  const today = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

  // 3) Revisar eventos y fechas importantes de cada cuenta que tenga chat ID
  const { data: rows } = await sb.from("panel_state").select("user_id,data");
  let enviados = 0;
  for (const row of rows ?? []) {
    const d: any = row.data ?? {};
    const chat = d.cfg?.TGCHAT;
    if (!chat || d.cfg?.TG === false) continue;
    const hidden: string[] = d.L?.hidden ?? [];
    // Igual que la campana del panel: fechas importantes avisan salvo 🔕; eventos cargados solo con 🔔.
    const items = [
      ...(d.cfg?.FECHAS ?? []).filter((e: any) => e?.imp !== false),
      ...(d.L?.events ?? []).filter((e: any) => e?.imp === true),
    ].filter((e: any) => e?.f && e?.x && !hidden.includes(e.f + "|" + e.x));
    for (const e of items) {
      const n = Math.round(
        (Date.parse(e.f + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 864e5,
      );
      if (n !== 7 && n !== 1) continue;
      const key = row.user_id + "|" + e.f + "|" + e.x + "|" + n;
      if (!(await once(key))) continue;
      const cuando = n === 1 ? "Mañana" : "En 7 días";
      const fecha = e.f.slice(8) + "/" + e.f.slice(5, 7) + (e.t ? " " + e.t : "");
      await tg("sendMessage", { chat_id: chat, text: cuando + ": " + e.x + " (" + fecha + ")" });
      enviados++;
    }
  }
  return new Response("ok, avisos enviados: " + enviados);
});
