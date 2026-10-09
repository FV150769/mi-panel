// Edge Function "entrar": entrar con usuario (en vez del email) y "Me olvidé la contraseña" con usuario.
// Antes la página le pedía a la base el email de un usuario y entraba con eso: cualquiera podía averiguar el email de otro.
// Ahora el email nunca sale del servidor: esta función busca el email, inicia la sesión y le devuelve a la página solo
// los tokens de la sesión. Los errores son siempre los mismos ("usuario o contraseña incorrectos") para no revelar quién
// existe, y después de 5 intentos fallidos con el mismo usuario en 15 minutos, ese usuario queda frenado 15 minutos.
// Se publica sin verificación de JWT (todavía no hay sesión): todo lo valida la función.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_SB = Deno.env.get("SUPABASE_URL")!;
const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, opciones);
const publico = () => createClient(URL_SB, Deno.env.get("SUPABASE_ANON_KEY")!, opciones);
// A dónde lleva el mail para elegir una contraseña nueva (tiene que estar en Auth → URL Configuration).
const VOLVER = "https://fv150769.github.io/petaca/";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
const MAL = "Usuario o contraseña incorrectos.";

// Email de un usuario, solo del lado del servidor.
async function emailDe(usuario: string): Promise<string> {
  const { data } = await admin.from("profiles").select("user_id").eq("username", usuario).maybeSingle();
  if (!data?.user_id) return "";
  const { data: u } = await admin.auth.admin.getUserById(data.user_id);
  return u?.user?.email ?? "";
}

// Las respuestas tardan siempre al menos lo mismo, así el tiempo no delata si el usuario existe.
async function parejo<T>(t0: number, r: T): Promise<T> {
  const falta = 700 - (Date.now() - t0);
  if (falta > 0) await new Promise((ok) => setTimeout(ok, falta));
  return r;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const t0 = Date.now();
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Pedido inválido" }, 400);
  }
  const accion = String(body?.accion ?? "");
  const usuario = String(body?.usuario ?? "").trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,20}$/.test(usuario)) {
    return await parejo(t0, accion === "olvido" ? json({ ok: true }) : json({ error: MAL }, 400));
  }

  if (accion === "olvido") {
    const email = await emailDe(usuario);
    if (email) await publico().auth.resetPasswordForEmail(email, { redirectTo: VOLVER }).catch(() => {});
    return await parejo(t0, json({ ok: true }));
  }

  if (accion !== "entrar") return json({ error: "Pedido inválido" }, 400);
  const clave = String(body?.clave ?? "");
  if (clave.length < 6 || clave.length > 200) return await parejo(t0, json({ error: MAL }, 400));

  const { data: freno } = await admin.from("login_intentos").select("hasta").eq("usuario", usuario).maybeSingle();
  if (freno?.hasta && Date.parse(freno.hasta) > Date.now()) {
    return await parejo(t0, json({ error: "Demasiados intentos con ese usuario. Probá de nuevo en 15 minutos." }, 429));
  }

  const email = await emailDe(usuario);
  const { data, error } = email
    ? await publico().auth.signInWithPassword({ email, password: clave })
    : { data: null, error: { message: "no existe" } };
  if (error || !data?.session) {
    if (/not confirmed/i.test(error?.message ?? "")) {
      return await parejo(t0, json({ error: "Confirmá tu email: te mandamos un mail cuando te registraste. Revisá también spam." }, 400));
    }
    await admin.rpc("login_fallo", { u: usuario }).then(() => {}, () => {});
    return await parejo(t0, json({ error: MAL }, 400));
  }
  await admin.from("login_intentos").delete().eq("usuario", usuario).then(() => {}, () => {});
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
