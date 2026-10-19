// buddyup photo API — a Cloudflare Worker in front of a private R2 bucket.
//
//   PUT /api/photo        upload the caller's profile photo (JPEG body) → { url }
//   DELETE /api/photo     delete the caller's profile photo (account deletion)
//   GET /photos/<key>     read a profile photo
//   (scheduled)           email locals once they're approved (mailer.js)
//
// Both routes require a Firebase ID token (`Authorization: Bearer <token>`), verified
// against Google's public keys, so photos are only visible to signed-in buddyup users —
// the same audience that can read profiles in Firestore. The bucket itself stays private.
// Deploy with `npx wrangler deploy` from this folder (see wrangler.toml and the README).

import { sendApprovalEmails } from "./mailer.js";

const MAX_BYTES = 600 * 1024; // the app sends ≤ 500 KB; 20% headroom for encoder variance
const KEY_RE = /^profiles\/[A-Za-z0-9]{1,128}\/[0-9a-f-]{36}\.jpg$/;
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export default {
  // Every 10 minutes: email locals whose profile has just been approved (see mailer.js).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendApprovalEmails(env).then((r) => console.log("approval emails", JSON.stringify(r))));
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const reply = (status, body, extra = {}) => new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status, headers: { ...cors, "Content-Type": typeof body === "string" ? "text/plain" : "application/json", ...extra },
    });

    let uid;
    try { uid = await verifyIdToken(req.headers.get("Authorization"), env.FIREBASE_PROJECT_ID); }
    catch { return reply(401, "Sign in to buddyup first.", { "WWW-Authenticate": 'Bearer realm="buddyup"' }); }

    if (url.pathname === "/api/photo" && req.method === "PUT") {
      if (req.headers.get("Content-Type") !== "image/jpeg") return reply(415, "Photos must be JPEG.");
      if (+req.headers.get("Content-Length") > MAX_BYTES) return reply(413, "That photo is too large.");
      const body = new Uint8Array(await req.arrayBuffer());
      if (body.length > MAX_BYTES) return reply(413, "That photo is too large.");
      if (body.length < 3 || body[0] !== 0xff || body[1] !== 0xd8 || body[2] !== 0xff) return reply(415, "That doesn't look like a JPEG.");

      // One photo per person: store the new one, then remove any older ones.
      const prefix = `profiles/${uid}/`;
      const key = `${prefix}${crypto.randomUUID()}.jpg`;
      await env.PHOTOS.put(key, body, { httpMetadata: { contentType: "image/jpeg" }, customMetadata: { uid } });
      const old = await env.PHOTOS.list({ prefix });
      const stale = old.objects.map((o) => o.key).filter((k) => k !== key);
      if (stale.length) await env.PHOTOS.delete(stale);
      return reply(200, { url: `${url.origin}/photos/${key}` });
    }

    if (url.pathname === "/api/photo" && req.method === "DELETE") {
      const all = await env.PHOTOS.list({ prefix: `profiles/${uid}/` });
      if (all.objects.length) await env.PHOTOS.delete(all.objects.map((o) => o.key));
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname.startsWith("/photos/") && req.method === "GET") {
      const key = url.pathname.slice("/photos/".length);
      if (!KEY_RE.test(key)) return reply(404, "Not found");
      const obj = await env.PHOTOS.get(key);
      if (!obj) return reply(404, "Not found");
      // Keys are never reused, so the browser may keep its copy; `private` keeps shared caches out.
      return new Response(obj.body, { headers: { ...cors, "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
    }

    return reply(404, "Not found");
  },
};

function corsHeaders(req, env) {
  const origin = req.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// ---------- Firebase ID token verification (RS256, Google's rotating public keys) ----------
let jwksCache = { keys: null, until: 0 };

async function publicKey(kid) {
  if (!jwksCache.keys || Date.now() > jwksCache.until) {
    const res = await fetch(JWKS_URL);
    if (!res.ok) throw new Error("jwks");
    const maxAge = +(/max-age=(\d+)/.exec(res.headers.get("Cache-Control") || "")?.[1] || 3600);
    jwksCache = { keys: (await res.json()).keys, until: Date.now() + maxAge * 1000 };
  }
  const jwk = jwksCache.keys.find((k) => k.kid === kid);
  if (!jwk) throw new Error("kid");
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const json = (s) => JSON.parse(new TextDecoder().decode(b64url(s)));

async function verifyIdToken(header, projectId) {
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not set"); // fail closed
  const token = /^Bearer (.+)$/.exec(header || "")?.[1];
  const parts = token?.split(".");
  if (parts?.length !== 3) throw new Error("format");
  const [h, p, sig] = parts;
  const head = json(h), claims = json(p);
  if (head.alg !== "RS256" || !head.kid) throw new Error("alg");
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", await publicKey(head.kid), b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error("signature");
  const now = Math.floor(Date.now() / 1000), skew = 60;
  if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("audience");
  if (!(claims.exp > now - skew) || !(claims.iat <= now + skew) || !(claims.auth_time <= now + skew)) throw new Error("expired");
  if (typeof claims.sub !== "string" || !/^[A-Za-z0-9]{1,128}$/.test(claims.sub)) throw new Error("subject");
  return claims.sub;
}
