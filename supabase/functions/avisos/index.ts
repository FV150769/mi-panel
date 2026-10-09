// Edge Function de avisos (en el dashboard se llama "telegram"; su URL es /avisos). Se publica sin verificación de JWT
// porque la llama el cron; por eso cada camino se cuida solo:
// - El cron (cada 15 minutos) tiene que mandar la clave x-cron-secret (secreto CRON_SECRET; en la base está en Vault).
//   Manda los eventos marcados con 🔔 según las preferencias de cada cuenta (días antes + hora, y/o X horas antes),
//   por Telegram al chat vinculado y como notificación a cada celular que activó los avisos. Cada aviso sale una sola vez.
// - Desde el panel, con la sesión iniciada: {prueba:true} manda un aviso de prueba; {vincular:true} arma el link de
//   Telegram (t.me/bot?start=código) que abre la propia persona; {vinculado:true} se fija si ya lo abrió; {desvincular:true}.
//   Vincular con un link (y no pegando un número) evita que alguien mande sus avisos al chat de otra persona.
import { createClient } from "npm:@supabase/supabase-js@2";
import { b64u, enviarPush } from "./webpush.js";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const CRON = Deno.env.get("CRON_SECRET") ?? "";
const BOT = "mipanel_fv_bot";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// Notificaciones del celular: clave VAPID (pública en base64url y privada como JWK) y a quién contactar.
let VAPID: { jwk: any; publica: string; sub: string } | null = null;
try {
  const jwk = JSON.parse(Deno.env.get("VAPID_PRIVATE_JWK") ?? "");
  const publica = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  if (jwk?.d && publica) VAPID = { jwk, publica, sub: Deno.env.get("VAPID_SUBJECT") || "https://fv150769.github.io/petaca/" };
} catch {
  // sin claves: solo Telegram
}

async function tg(method: string, body: unknown) {
  const r = await fetch("https://api.telegram.org/bot" + TOKEN + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return await r.json().catch(() => ({}));
}

// Una sola vez por aviso: la clave es única en la tabla, así que si dos corridas se cruzan, solo una lo manda.
async function once(key: string): Promise<boolean> {
  const { error } = await sb.from("avisos_enviados").insert({ k: key });
  return !error;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function iguales(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// Chat vinculado y celulares de una cuenta (o de todas). Si las tablas nuevas todavía no existen, usa el chat del panel.
async function canales(uid?: string) {
  const chats = new Map<string, number>();
  const subs = new Map<string, any[]>();
  let q1 = sb.from("tg_chats").select("user_id,chat_id");
  if (uid) q1 = q1.eq("user_id", uid);
  const c = await q1;
  if (!c.error) for (const r of c.data ?? []) chats.set(r.user_id, Number(r.chat_id));
  let q2 = sb.from("push_subs").select("user_id,endpoint,p256dh,auth");
  if (uid) q2 = q2.eq("user_id", uid);
  const p = await q2;
  if (!p.error) for (const r of p.data ?? []) subs.set(r.user_id, [...(subs.get(r.user_id) ?? []), r]);
  return { chats, subs, viejo: !!c.error };
}

// Manda un aviso por todos los canales de la cuenta. Las suscripciones que ya no existen se borran solas.
async function avisar(chat: number | undefined, subs: any[], texto: string, tag: string) {
  let n = 0;
  if (chat) {
    const d = await tg("sendMessage", { chat_id: chat, text: texto });
    if (d?.ok) n++;
  }
  for (const s of subs) {
    if (!VAPID) break;
    try {
      const st = await enviarPush(s, { t: "PETACA", b: texto, tag }, VAPID);
      if (st === 404 || st === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
      else if (st < 300) n++;
    } catch {
      // un celular que no responde no frena al resto
    }
  }
  return n;
}

// Lee lo que le escribieron al bot: "/start código" vincula el chat con la cuenta que pidió el link.
// Al resto le explica cómo vincular. Devuelve las cuentas que se vincularon.
async function leerBot() {
  const up = await tg("getUpdates", { timeout: 0, allowed_updates: ["message"] });
  const msgs = (up?.result ?? []).filter((u: any) => u.message?.chat?.id);
  const vinculados: string[] = [];
  const respondidos = new Set<number>();
  for (const u of msgs) {
    const chat = Number(u.message.chat.id);
    const m = String(u.message.text ?? "").trim().match(/^\/start\s+([A-Za-z0-9_-]{16,64})$/);
    if (m) {
      const { data: v } = await sb.from("tg_vinculos").select("user_id,expira").eq("token", m[1]).maybeSingle();
      if (v && Date.parse(v.expira) > Date.now()) {
        await sb.from("tg_chats").upsert({ user_id: v.user_id, chat_id: chat, creado: new Date().toISOString() });
        await sb.from("tg_vinculos").delete().eq("token", m[1]);
        vinculados.push(v.user_id);
        await tg("sendMessage", { chat_id: chat, text: "¡Listo! ✅ Desde ahora PETACA te avisa por acá de lo que marques con 🔔. ⚽" });
      } else {
        await tg("sendMessage", { chat_id: chat, text: "Ese link ya venció. En PETACA, volvé a tocar \"Vincular Telegram\"." });
      }
      respondidos.add(chat);
      continue;
    }
    if (respondidos.has(chat)) continue;
    respondidos.add(chat);
    await tg("sendMessage", {
      chat_id: chat,
      text: "¡Hola! Para recibir los avisos de PETACA, abrí la app: ⚙️ Configuración → Avisos → \"Vincular Telegram\".",
    });
  }
  if (msgs.length) await tg("getUpdates", { offset: msgs[msgs.length - 1].update_id + 1, timeout: 0 });
  return vinculados;
}

async function usuario(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await sb.auth.getUser(jwt);
  return data?.user ?? null;
}

// Gastos fijos (cfg.FIJOS: {id, x, m, c, d: día del mes}): vencen ese día de cada mes (o el último, si el mes es más corto).
// Uno ya está "hecho" ese mes si se marcó en el panel (L.fijos: "id|AAAA-MM|ok" o "|no") o si se cargó un gasto que coincide
// (misma categoría y monto, o el nombre en el detalle), igual que en la página.
const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function diasMes(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function mesSig(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? (y + 1) + "-01" : y + "-" + String(m + 1).padStart(2, "0");
}
function vence(fj: any, ym: string) {
  return ym + "-" + String(Math.min(Math.max(1, Number(fj.d) | 0), diasMes(ym))).padStart(2, "0");
}
function fijoHecho(fj: any, ym: string, d: any) {
  const k = fj.id + "|" + ym + "|";
  if ((d.L?.fijos ?? []).some((s: unknown) => String(s).startsWith(k))) return true;
  const nx = sinTildes(String(fj.x ?? ""));
  return (d.L?.expenses ?? []).some((e: any) =>
    String(e?.f ?? "").slice(0, 7) === ym && e?.x !== "Ajuste de saldo" &&
    ((e?.c === fj.c && Number(e?.m) === Number(fj.m)) || (nx.length >= 3 && sinTildes(String(e?.x ?? "")).includes(nx)))
  );
}

// Pedidos del panel (con la sesión iniciada)
async function panel(req: Request, body: any) {
  const u = await usuario(req);
  if (!u) return json({ error: "Iniciá sesión primero" }, 401);
  if (body.vincular === true) {
    const token = b64u(crypto.getRandomValues(new Uint8Array(18)));
    await sb.from("tg_vinculos").delete().lt("expira", new Date().toISOString());
    const { error } = await sb.from("tg_vinculos").insert({ user_id: u.id, token, expira: new Date(Date.now() + 20 * 60e3).toISOString() });
    if (error) return json({ error: "No pude preparar el link. Probá de nuevo en un rato." }, 500);
    return json({ link: "https://t.me/" + BOT + "?start=" + token, bot: BOT });
  }
  if (body.vinculado === true) {
    await leerBot().catch(() => []);
    const { chats } = await canales(u.id);
    return json({ chat: chats.get(u.id) ?? null });
  }
  if (body.desvincular === true) {
    await sb.from("tg_chats").delete().eq("user_id", u.id);
    return json({ ok: true });
  }
  if (body.prueba === true) {
    const { chats, subs } = await canales(u.id);
    const chat = chats.get(u.id), ps = subs.get(u.id) ?? [];
    if (!chat && !ps.length) return json({ error: "Todavía no vinculaste Telegram ni activaste los avisos en este celular." }, 400);
    const n = await avisar(chat, ps, "✅ PETACA: los avisos están funcionando. ⚽", "prueba");
    if (!n) return json({ error: "No pude mandar el aviso. Si es Telegram, revisá que no hayas bloqueado al bot." }, 502);
    return json({ ok: true, telegram: !!chat, celulares: ps.length });
  }
  return json({ error: "Pedido inválido" }, 400);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  if (!TOKEN) return json({ error: "Falta el secreto TELEGRAM_BOT_TOKEN" }, 500);
  const body = await req.json().catch(() => ({}));
  if (body?.prueba === true || body?.vincular === true || body?.vinculado === true || body?.desvincular === true) {
    return await panel(req, body);
  }

  // De acá en adelante, solo el cron: sin la clave, no corre (así nadie puede dispararlo).
  if (!CRON) return json({ error: "Falta el secreto CRON_SECRET" }, 500);
  if (!iguales(req.headers.get("x-cron-secret") ?? "", CRON)) return json({ error: "No autorizado" }, 401);

  // 1) Vincular a quien abrió el link del bot
  await leerBot().catch(() => []);

  // 2) Hora actual en Argentina (UTC-3, sin horario de verano)
  const ahora = Date.now();
  const ar = new Date(ahora - 3 * 3600 * 1000);
  const today = ar.toISOString().slice(0, 10);
  const minHoy = ar.getUTCHours() * 60 + ar.getUTCMinutes();

  // 3) Revisar los eventos y fechas importantes de cada cuenta que tenga Telegram vinculado o avisos en el celular
  const { chats, subs, viejo } = await canales();
  const { data: rows } = await sb.from("panel_state").select("user_id,data");
  let enviados = 0;
  for (const row of rows ?? []) {
    const d: any = row.data ?? {};
    const chat = chats.get(row.user_id) ?? (viejo && /^-?\d{5,15}$/.test(String(d.cfg?.TGCHAT ?? "")) ? Number(d.cfg.TGCHAT) : undefined);
    const ps = subs.get(row.user_id) ?? [];
    if (!chat && !ps.length) continue;
    // Preferencias de cada usuario (Avisos → Cuándo avisarte)
    const av = d.cfg?.TGAV ?? {};
    const dias: number[] = Array.isArray(av.d) ? av.d : [7, 1];
    const [hh, mm] = String(av.h || "09:00").split(":").map(Number);
    const horas = Number(av.hs) > 0 ? Number(av.hs) : 0;
    const hidden: string[] = d.L?.hidden ?? [];
    // Igual que la campana del panel: fechas importantes avisan salvo 🔕; eventos cargados solo con 🔔.
    const items = [
      ...(d.cfg?.FECHAS ?? []).filter((e: any) => e?.imp !== false),
      ...(d.L?.events ?? []).filter((e: any) => e?.imp === true),
    ].filter((e: any) => e?.f && e?.x && !hidden.includes(e.f + "|" + e.x));
    for (const e of items) {
      const fecha = e.f.slice(8) + "/" + e.f.slice(5, 7) + (e.t ? " " + e.t : "");
      // a) Avisos por días (ej: 7 y 1 día antes), a partir de la hora elegida
      const n = Math.round((Date.parse(e.f + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 864e5);
      if (dias.includes(n) && minHoy >= (hh || 0) * 60 + (mm || 0)) {
        const key = row.user_id + "|" + e.f + "|" + e.x + "|" + n;
        if (await once(key)) {
          const cuando = n === 0 ? "Hoy" : n === 1 ? "Mañana" : "En " + n + " días";
          enviados += await avisar(chat, ps, cuando + ": " + e.x + " (" + fecha + ")", key);
        }
      }
      // b) Aviso X horas antes del inicio (solo eventos con hora)
      if (horas && /^\d{2}:\d{2}$/.test(e.t || "")) {
        const falta = Date.parse(e.f + "T" + e.t + ":00-03:00") - ahora;
        if (falta > 0 && falta <= horas * 3600 * 1000) {
          const key = row.user_id + "|" + e.f + "|" + e.x + "|" + e.t + "|h" + horas;
          if (await once(key)) {
            const min = Math.round(falta / 60000);
            const en = min >= 60 ? "En " + Math.round(min / 6) / 10 + " h" : "En " + min + " min";
            enviados += await avisar(chat, ps, en + ": " + e.x + " (" + fecha + ")", key);
          }
        }
      }
    }
    // c) Gastos fijos: los días antes que eligió (y a la hora elegida), si ese mes todavía no está hecho
    for (const fj of Array.isArray(d.cfg?.FIJOS) ? d.cfg.FIJOS : []) {
      if (!fj?.id || !fj?.x || !(Number(fj.m) > 0)) continue;
      for (const ym of [today.slice(0, 7), mesSig(today.slice(0, 7))]) {
        const f = vence(fj, ym);
        const n = Math.round((Date.parse(f + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 864e5);
        if (n < 0 || !dias.includes(n) || minHoy < (hh || 0) * 60 + (mm || 0) || fijoHecho(fj, ym, d)) continue;
        const key = row.user_id + "|fijo|" + fj.id + "|" + ym + "|" + n;
        if (await once(key)) {
          const cuando = n === 0 ? "Hoy vence" : n === 1 ? "Mañana vence" : "En " + n + " días vence";
          const monto = "$" + Math.round(Number(fj.m)).toLocaleString("es-AR");
          enviados += await avisar(chat, ps, cuando + ": " + fj.x + " (" + monto + ", el " + f.slice(8) + "/" + f.slice(5, 7) + ")", key);
        }
      }
    }
  }
  return json({ ok: true, enviados });
});
