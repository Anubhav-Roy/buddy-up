// Emails a local once their profile is approved. Runs on a schedule (see wrangler.toml):
// reviewers still approve locals by setting users/{uid}.approved = true in the Firebase console;
// this finds approved locals that haven't been emailed yet, sends the email through Resend from
// contact@buddyup.fyi, and records users/{uid}.approvalEmailedAt so nobody is emailed twice.
//
// Secrets (wrangler secret put / Cloudflare dashboard):
//   FIREBASE_SERVICE_ACCOUNT  JSON key of a service account with the "Cloud Datastore User" role
//   RESEND_API_KEY            Resend API key with sending access for buddyup.fyi

const FIRESTORE = "https://firestore.googleapis.com/v1";

export async function sendApprovalEmails(env, { fetchImpl = fetch } = {}) {
  if (!env.FIREBASE_SERVICE_ACCOUNT || !env.RESEND_API_KEY) return { skipped: "missing secrets" };
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const token = await googleAccessToken(sa, fetchImpl);
  const db = `${FIRESTORE}/projects/${sa.project_id}/databases/(default)/documents`;
  const auth = { Authorization: `Bearer ${token}` };

  // Approved users who haven't had the email yet (Firestore can't query a missing field, so
  // the second condition is checked here).
  const res = await fetchImpl(`${db}:runQuery`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: "users" }],
      where: { fieldFilter: { field: { fieldPath: "approved" }, op: "EQUAL", value: { booleanValue: true } } },
      limit: 500,
    } }),
  });
  if (!res.ok) throw new Error(`firestore query ${res.status}`);
  const pending = (await res.json()).map((r) => r.document).filter((d) => d && !d.fields?.approvalEmailedAt);

  const sent = [];
  for (const doc of pending) {
    const uid = doc.name.split("/").pop();
    const f = doc.fields || {};
    const info = await fetchImpl(`${db}/users/${uid}/private/info`, { headers: auth });
    if (!info.ok) continue;
    const email = (await info.json()).fields?.email?.stringValue;
    if (!email) continue;
    const name = (f.name?.stringValue || "").split(" ")[0] || "there";
    const city = f.localCity?.stringValue || "your city";

    const mail = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `approval-${uid}` },
      body: JSON.stringify(approvalEmail({ to: email, name, city, site: env.SITE_URL || "https://buddyup.fyi", from: env.MAIL_FROM || "buddyup <contact@buddyup.fyi>" })),
    });
    if (!mail.ok) { console.error("resend", uid, mail.status, await mail.text()); continue; }

    await fetchImpl(`${db}/users/${uid}?updateMask.fieldPaths=approvalEmailedAt`, {
      method: "PATCH", headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { approvalEmailedAt: { timestampValue: new Date().toISOString() } } }),
    });
    sent.push(uid);
  }
  return { sent };
}

export function approvalEmail({ to, name, city, site, from }) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = `${site}/#/discover`;
  const text = `Hi ${name},

Your local profile is approved. People in ${city} can now find you on buddyup and send you meetup requests.

Your requests and people to meet are on your dashboard:
${link}

buddyup
${site.replace(/^https?:\/\//, "")}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2433;max-width:520px">
  <p>Hi ${esc(name)},</p>
  <p>Your local profile is approved. People in ${esc(city)} can now find you on buddyup and send you meetup requests.</p>
  <p><a href="${esc(link)}" style="display:inline-block;background:#1fb393;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Open your dashboard</a></p>
  <p style="color:#6b7385;font-size:13px">buddyup · <a href="${esc(site)}" style="color:#6b7385">${esc(site.replace(/^https?:\/\//, ""))}</a></p>
</div>`;
  return { from, to: [to], subject: "You're approved as a local on buddyup", text, html };
}

// OAuth access token for a Google service account (JWT bearer grant, signed with its key).
async function googleAccessToken(sa, fetchImpl) {
  const b64url = (data) => btoa(typeof data === "string" ? data : String.fromCharCode(...new Uint8Array(data))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: sa.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetchImpl(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return (await res.json()).access_token;
}
