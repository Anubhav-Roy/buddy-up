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

// Emails people about chat messages they haven't read yet. Runs on the same schedule as the
// approval emails: finds chats updated in the last day whose last message is from the other
// person and newer than both the recipient's readAt and their emailedAt, sends one email per
// chat (however many messages arrived since), and records chats/{id}.emailedAt.{uid}. The
// email names the sender but doesn't include the message text. System notes (meetup
// accepted / cancelled) and blocked chats don't trigger an email, and nobody who has turned
// off "Message emails" in Profile → Settings (private/info.emailMessages == false) gets one.
const LOOKBACK_MS = 24 * 3600 * 1000;

export async function sendMessageEmails(env, { fetchImpl = fetch, now = Date.now() } = {}) {
  if (!env.FIREBASE_SERVICE_ACCOUNT || !env.RESEND_API_KEY) return { skipped: "missing secrets" };
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const token = await googleAccessToken(sa, fetchImpl);
  const db = `${FIRESTORE}/projects/${sa.project_id}/databases/(default)/documents`;
  const auth = { Authorization: `Bearer ${token}` };
  const runQuery = async (parent, structuredQuery) => {
    const res = await fetchImpl(`${parent}:runQuery`, {
      method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery }),
    });
    if (!res.ok) throw new Error(`firestore query ${res.status}`);
    return (await res.json()).map((r) => r.document).filter(Boolean);
  };
  const time = (v) => (v?.timestampValue ? Date.parse(v.timestampValue) : 0);

  const chats = await runQuery(db, {
    from: [{ collectionId: "chats" }],
    where: { fieldFilter: { field: { fieldPath: "updatedAt" }, op: "GREATER_THAN", value: { timestampValue: new Date(now - LOOKBACK_MS).toISOString() } } },
    limit: 500,
  });

  const names = {};
  const firstName = async (uid) => {
    if (!(uid in names)) {
      const res = await fetchImpl(`${db}/users/${uid}`, { headers: auth });
      const full = res.ok ? (await res.json()).fields?.name?.stringValue || "" : "";
      names[uid] = full.trim().split(/\s+/)[0] || "Someone";
    }
    return names[uid];
  };

  const sent = [];
  for (const chat of chats) {
    const chatId = chat.name.split("/").pop();
    const f = chat.fields || {};
    const last = f.lastMessage?.mapValue?.fields || {};
    const from = last.from?.stringValue;
    const participants = (f.participants?.arrayValue?.values || []).map((v) => v.stringValue);
    const to = participants.find((p) => p !== from);
    if (!from || !to || participants.length !== 2 || last.type?.stringValue === "sys") continue;
    if ((f.blockedBy?.arrayValue?.values || []).length) continue;
    const lastTs = time(last.ts);
    const since = Math.max(time(f.readAt?.mapValue?.fields?.[to]), time(f.emailedAt?.mapValue?.fields?.[to]));
    if (!lastTs || lastTs <= since) continue;

    // How many messages from the sender they haven't read or been emailed about.
    const msgs = await runQuery(`${db}/chats/${chatId}`, {
      from: [{ collectionId: "messages" }],
      where: { fieldFilter: { field: { fieldPath: "ts" }, op: "GREATER_THAN", value: { timestampValue: new Date(since).toISOString() } } },
      orderBy: [{ field: { fieldPath: "ts" } }],
      limit: 100,
    });
    const count = msgs.filter((m) => m.fields?.from?.stringValue === from && m.fields?.type?.stringValue !== "sys").length;
    if (!count) continue;

    const info = await fetchImpl(`${db}/users/${to}/private/info`, { headers: auth });
    if (!info.ok) continue; // e.g. the recipient deleted their account
    const prefs = (await info.json()).fields || {};
    const email = prefs.email?.stringValue;
    if (!email || prefs.emailMessages?.booleanValue === false) continue;

    const mail = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `message-${chatId}-${to}-${lastTs}` },
      body: JSON.stringify(messageEmail({ to: email, chatId, name: await firstName(to), sender: await firstName(from), count, site: env.SITE_URL || "https://buddyup.fyi", from: env.MAIL_FROM || "buddyup <contact@buddyup.fyi>" })),
    });
    if (!mail.ok) { console.error("resend", chatId, mail.status, await mail.text()); continue; }

    // Backticks: uids can start with a digit, which a bare field path doesn't allow.
    await fetchImpl(`${db}/chats/${chatId}?updateMask.fieldPaths=${encodeURIComponent(`emailedAt.\`${to}\``)}`, {
      method: "PATCH", headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { emailedAt: { mapValue: { fields: { [to]: { timestampValue: new Date(lastTs).toISOString() } } } } } }),
    });
    sent.push(chatId);
    await new Promise((ok) => setTimeout(ok, 600)); // Resend's default limit is 2 requests/second
  }
  return { sent };
}

export function messageEmail({ to, chatId, name, sender, count, site, from }) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = `${site}/#/messages/${encodeURIComponent(chatId)}`;
  const domain = site.replace(/^https?:\/\//, "");
  const what = count === 1 ? "a new message" : `${count} new messages`;
  const text = `Hi ${name},

${sender} sent you ${what} on buddyup.

Read and reply:
${link}

You're getting this because you have a buddyup account at ${domain}. To stop these emails, turn off "Message emails" in your profile settings:
${site}/#/profile`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2433;max-width:520px">
  <p>Hi ${esc(name)},</p>
  <p>${esc(sender)} sent you ${esc(what)} on buddyup.</p>
  <p><a href="${esc(link)}" style="display:inline-block;background:#1fb393;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Read and reply</a></p>
  <p style="color:#6b7385;font-size:13px">You're getting this because you have a buddyup account at <a href="${esc(site)}" style="color:#6b7385">${esc(domain)}</a>. To stop these emails, turn off <a href="${esc(site)}/#/profile" style="color:#6b7385">Message emails</a> in your profile settings.</p>
</div>`;
  return { from, to: [to], subject: `${sender} sent you ${what} on buddyup`, text, html };
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
