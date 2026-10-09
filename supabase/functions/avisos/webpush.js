// Web Push sin librerías: cifra el mensaje para el celular (RFC 8291, aes128gcm) y firma el permiso del servidor
// (RFC 8292, VAPID) con WebCrypto. Lo usa la función "avisos" para mandar los avisos como notificación del celular.
const te = new TextEncoder();

export function b64u(buf) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function deb64u(s) {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function junta(...partes) {
  const out = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of partes) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
async function hmac(clave, datos) {
  const k = await crypto.subtle.importKey("raw", clave, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, datos));
}

// Cifra el mensaje para una suscripción (p256dh y auth en base64url). opts.claves y opts.sal son solo para las pruebas.
export async function cifrar(mensaje, p256dh, auth, opts = {}) {
  const ua = deb64u(p256dh);
  const secreto = deb64u(auth);
  const par = opts.claves ?? (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", par.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const compartido = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, par.privateKey, 256));
  const prkClave = await hmac(secreto, compartido);
  const ikm = (await hmac(prkClave, junta(te.encode("WebPush: info\0"), ua, asPub, new Uint8Array([1])))).slice(0, 32);
  const sal = opts.sal ?? crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(sal, ikm);
  const cek = (await hmac(prk, junta(te.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, junta(te.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const datos = junta(typeof mensaje === "string" ? te.encode(mensaje) : mensaje, new Uint8Array([2]));
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, datos));
  // Encabezado: sal (16) | tamaño de registro 4096 (uint32) | largo de la clave (1) | clave pública del servidor (65)
  return junta(sal, new Uint8Array([0, 0, 16, 0, asPub.length]), asPub, cifrado);
}

// Encabezado Authorization con el permiso firmado (vale 12 horas) para el servicio de push de esa suscripción.
export async function vapid(endpoint, jwkPrivada, publica, sub) {
  const aud = new URL(endpoint).origin;
  const cab = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const cuerpo = b64u(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const { kty, crv, d, x, y } = jwkPrivada;
  const k = await crypto.subtle.importKey("jwk", { kty, crv, d, x, y }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, te.encode(cab + "." + cuerpo));
  return "vapid t=" + cab + "." + cuerpo + "." + b64u(firma) + ", k=" + publica;
}

// Manda un aviso a una suscripción ({endpoint, p256dh, auth}). Devuelve el estado HTTP (404 o 410: la suscripción ya no existe).
export async function enviarPush(s, mensaje, cfg) {
  const cuerpo = await cifrar(JSON.stringify(mensaje), s.p256dh, s.auth);
  const r = await fetch(s.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
      Authorization: await vapid(s.endpoint, cfg.jwk, cfg.publica, cfg.sub),
    },
    body: cuerpo,
    signal: AbortSignal.timeout(10_000),
  });
  await r.body?.cancel();
  return r.status;
}
